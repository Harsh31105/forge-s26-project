import { Request, Response } from "express";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { eq } from "drizzle-orm";
import { student } from "../../../storage/tables/student";
import { StudentRepository } from "../../../storage/storage";

export class AuthHandler {
    constructor(
        private readonly db: NodePgDatabase,
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
        })

        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
            res.status(400).json({ error: "Failed to get user information"});
            return;
        }

        if (!payload.email.endsWith("@husky.neu.edu")) {
            res.status(403).json({ error: "Only Northeastern email addresses are allowed"});
            return;
        }

        const [ studentAuth ] = await this.db.select().from(student).where(eq(student.email, payload.email));

        if (studentAuth) {
            res.status(200).json({ student: studentAuth});
        } else {
            const newStudent = await this.studentRepo.createStudent({
                firstName: payload.given_name!,
                lastName: payload.family_name!,
                email: payload.email,
            });
            res.status(201).json({ student: newStudent });
        }

        googleClient.setCredentials(tokens);

        res.status(200).json({ message: "Authenticated user." });
    }
}