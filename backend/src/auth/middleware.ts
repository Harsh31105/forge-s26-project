import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface UserPayload {
    id: string;
    email: string;
    name: string;
    iat?: number;
    exp?: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    let token = req.cookies?.token;
    const authHeader = req.headers.authorization;

    if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
    }

    if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    try {
        const decodedToken = jwt.verify(token, config.google.jwtSecret) as UserPayload;
        req.user = decodedToken;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
}
