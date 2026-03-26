import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { mapDBError } from "../../../errs/httpError";
import type { StudentRepository } from "../../../storage/storage";
import jwt from "jsonwebtoken";
import {Student} from "../../../models/student";

export class AuthHandler {
    constructor(
        private readonly studentRepo: StudentRepository
    ) {}

    async handleRedirect(req: Request, res: Response): Promise<void> {
        const url = getAuthUrl();
        res.redirect(url);
    }

    async handleCallback(req: Request, res: Response): Promise<void> {
        const code = req.query.code as string;
        if (!code) {
            res.status(400).json({ error: "Missing authorization code" });
            return;
        }

        const { tokens } = await googleClient.getToken(code);

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: config.google.clientId,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            res.status(400).json({ error: "Failed to get user information" });
            return;
        }

        if (!payload.email.endsWith("@husky.neu.edu")) {
            res.status(403).json({ error: "Only Northeastern email addresses are allowed" });
            return;
        }

        try {
            const student: Student = await this.studentRepo.createStudent({
                firstName: payload.given_name!,
                lastName: payload.family_name!,
                email: payload.email,
            });

            const token = jwt.sign(
                { id: student.id, email: payload.email, name: payload.name },
                config.google.jwtSecret,
                { expiresIn: "24h" }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
            });

            res.status(201).json({ message: "Signup successful" });
            return;
        } catch (error) {
            if (error instanceof Error) {
                if (
                    String(error.cause).includes("duplicate key") ||
                    String(error.cause).includes("unique constraint")
                ) {
                    // TODO: Get Student by Email.

                    const token = jwt.sign(
                        { email: payload.email, name: payload.name },
                        config.google.jwtSecret,
                        { expiresIn: "24h" }
                    );

                    res.cookie("token", token, {
                        httpOnly: true,
                        secure: false,
                        sameSite: "lax",
                    });

                    res.status(200).json({ message: "Login successful" });
                    return;
                }

                throw mapDBError(error, error.message);
            }
        }
    }
}
