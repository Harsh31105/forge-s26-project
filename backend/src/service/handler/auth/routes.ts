import { Router } from "express";
import { AuthHandler } from "./index";
import { authMiddleware } from "../../../auth/middleware";

export function authRoutes(handler: AuthHandler): Router {
    const router = Router();

    router.get("/signin", handler.handleRedirect.bind(handler));
    router.get("/callback", handler.handleCallback.bind(handler));
    router.get("/me", authMiddleware, handler.handleMe.bind(handler));

    return router;
}