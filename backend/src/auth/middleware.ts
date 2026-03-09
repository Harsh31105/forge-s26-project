import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface UserPayload {
    email: string;
    name: string;
    iat?: number;
    exp?: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decodedToken = jwt.verify(token, config.google.jwtSecret) as UserPayload;
        (req as any).user = decodedToken;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
}
