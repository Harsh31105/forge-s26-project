import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config";
import { mapDBError } from "../../../errs/httpError";
// TODO: Uncomment the import below
// import { StudentRepository } from "../../../storage/storage";
import jwt from "jsonwebtoken";

// Delete the two imports below "NodePgDatabase" and "student"
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { student } from "../../../storage/tables/student"

export class AuthHandler {
    constructor(
        // CHANGE NodePgDatabase to be StudentRepo
        private readonly studentRepo: NodePgDatabase
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

        try {
            // TODO: Uncomment this when you're done with Students endpoint and replace the block below. 
            // await this.studentRepo.createStudent({
            //     firstName: payload.given_name!,
            //     lastName: payload.family_name!,
            //     email: payload.email,
            // });
            
            // REPLACE lines 59-64 with the code above
            const newStudent = await this.studentRepo.insert(student).values({
                firstName: payload.given_name!, 
                lastName: payload.family_name!,
                email: payload.email,
            })

            const token = jwt.sign(
                { email: payload.email,  
                name: payload.name },
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

                if (String(error.cause).includes("duplicate key") || String(error.cause).includes("unique constraint")) {
                    
                const token = jwt.sign(
                { email: payload.email,  
                name: payload.name },
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

                } else {
                    throw mapDBError(error, error.message);
                }
            }

        }
    }
}
