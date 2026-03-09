import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { Conflict, mapDBError } from "../../../errs/httpError";
import { StudentRepository } from "../../../storage/storage";
import jwt from "jsonwebtoken";

export class AuthHandler {
    constructor(
        private readonly studentRepo: StudentRepository) {}

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

        try {
            await this.studentRepo.createStudent({
                firstName: payload.given_name!,
                lastName: payload.family_name!,
                email: payload.email,
            });

            const token = jwt.sign(
                { email: payload.email,  
                name: payload.name },
                config.google.jwtSecret,
                { expiresIn: "24h" }
            );

            res.status(201).json({ 
                message: "Signup successful",
                token,
             });
            return;

        } catch (error) {
            const mappedError : any= mapDBError(error, "failed to create student");
            if (mappedError instanceof Conflict) {

                const token = jwt.sign(
                { email: payload.email,  
                name: payload.name },
                config.google.jwtSecret,
                { expiresIn: "24h" }
                );
                
                res.status(200).json({ 
                    message: "Login successful",
                    token,
                });
                
                return;
            }
            throw mappedError;
        }
    }
}
