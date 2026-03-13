import { Router } from "express";
import { AuthHandler } from "./index";

export function authRoutes(handler: AuthHandler): Router {
    const router = Router();

    router.get("/signin", handler.handleRedirect.bind(handler));
    router.get("/callback", handler.handleCallback.bind(handler));

    return router;
}