import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { mapDBError } from "../../../errs/httpError";
import type { StudentRepository, ProfilePictureRepository } from "../../../storage/storage";
import type { UserPayload } from "../../../auth/middleware";
import jwt from "jsonwebtoken";

export class AuthHandler {
    constructor(
        private readonly studentRepo: StudentRepository,
        private readonly profilePictureRepo?: ProfilePictureRepository,
    ) {}

    async handleRedirect(_req: Request, res: Response): Promise<void> {
        const url = getAuthUrl();
        res.redirect(url);
    }

    async handleCallback(req: Request, res: Response): Promise<void> {
        const wantsHtml = req.accepts(["html", "json"]) === "html";
        const redirectWithError = (code: string, status: number, message: string) => {
            if (wantsHtml) {
                res.redirect(`${config.application.frontendUrl}/login?error=${encodeURIComponent(code)}`);
                return;
            }
            res.status(status).json({ error: message });
        };

        const redirectWithToken = (token: string) => {
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            res.redirect(`${config.application.frontendUrl}/login`);
        };

        const code = req.query.code as string;
        if (!code) {
            redirectWithError("missing_code", 400, "Missing authorization code");
            return;
        }

        const { tokens } = await googleClient.getToken(code);

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: config.google.clientId,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            redirectWithError("auth_failed", 400, "Failed to get user information");
            return;
        }

        if (!payload.email.endsWith("@husky.neu.edu")) {
            redirectWithError(
                "not_northeastern",
                403,
                "Only Northeastern email addresses are allowed"
            );
            return;
        }

        const makeToken = (id: string) =>
            jwt.sign(
                { id, email: payload.email, name: payload.name, picture: payload.picture ?? null },
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
            redirectWithToken(token);
        } catch (error) {
            if (error instanceof Error) {
                if (
                    String(error.cause).includes("duplicate key") ||
                    String(error.cause).includes("unique constraint")
                ) {
                    const student = await this.studentRepo.getStudentByEmail(payload.email);
                    const token = makeToken(student.id);
                    redirectWithToken(token);
                    return;
                }

                throw mapDBError(error, error.message);
            }
        }
    }

    async handleMe(req: Request, res: Response): Promise<void> {
        const user = (req as any).user as UserPayload;
        const student = await this.studentRepo.getStudentByEmail(user.email);

        let profilePictureUrl: string | null = null;
        if (student.profilePictureKey && this.profilePictureRepo) {
            try {
                profilePictureUrl = await this.profilePictureRepo.getPresignedUrl(student.profilePictureKey);
            } catch (err) {
                console.error("[handleMe] failed to generate presigned URL:", err);
            }
        }

        res.status(200).json({
            ...student,
            profilePictureUrl,
            googlePictureUrl: user.picture ?? null,
        });
    }
}
