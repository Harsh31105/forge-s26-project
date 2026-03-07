import { Request, Response } from "express";
import { googleClient, getAuthUrl } from "../../../auth/authClient";
import { config } from "../../../config/config"

export class AuthHandler {

    async handleLogin(req: Request, res: Response): Promise<void> {
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

        googleClient.setCredentials(tokens);

        res.status(200).json({ message: "Authenticated user." });
    }
}