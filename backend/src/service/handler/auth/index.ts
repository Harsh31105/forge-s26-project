import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { mapDBError } from "../../../errs/httpError";
import type { StudentRepository } from "../../../storage/storage";
import type { UserPayload } from "../../../auth/middleware";
import jwt from "jsonwebtoken";

export class AuthHandler {
    constructor(
        private readonly studentRepo: StudentRepository
    ) {}

    async handleRedirect(_req: Request, res: Response): Promise<void> {
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

        const makeToken = (id: string) =>
            jwt.sign(
                { id, email: payload.email, name: payload.name },
                config.google.jwtSecret,
                { expiresIn: "24h" }
            );

        try {
            const student = await this.studentRepo.createStudent({
                firstName: payload.given_name!,
                lastName: payload.family_name!,
                email: payload.email,
            });

            const token = makeToken(student.id);
            res.redirect(`${config.application.frontendUrl}/onboarding?token=${token}`);
        } catch (error) {
            if (error instanceof Error) {
                if (
                    String(error.cause).includes("duplicate key") ||
                    String(error.cause).includes("unique constraint")
                ) {
                    const student = await this.studentRepo.getStudentByEmail(payload.email);
                    const token = makeToken(student.id);
                    res.redirect(`${config.application.frontendUrl}/?token=${token}`);
                    return;
                }

                throw mapDBError(error, error.message);
            }
        }
    }

    async handleMe(req: Request, res: Response): Promise<void> {
        const user = (req as any).user as UserPayload;
        const student = await this.studentRepo.getStudentByEmail(user.email);
        res.status(200).json(student);
    }
}