import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

/**
 * Middleware for read-only public endpoints (reviews, courses, professors).
 * Passes if the request carries either:
 *   - A valid user JWT (Bearer token / cookie), or
 *   - The correct X-Api-Key header AND the method is GET.
 */
export function readOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
    const apiKey = config.application.animationApiKey;

    if (apiKey && req.headers["x-api-key"] === apiKey) {
        if (req.method !== "GET") {
            res.status(403).json({ error: "API key grants read-only access" });
            return;
        }
        next();
        return;
    }

    // Fall back to normal JWT auth
    authMiddleware(req, res, next);
}

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
