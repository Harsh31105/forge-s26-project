import { Router } from "express";
import { AuthHandler } from "./index";

export function authRoutes(handler: AuthHandler): Router {
    const router = Router();

    router.get("/login", handler.handleRedirect.bind(handler));
    router.get("/signup", handler.handleRedirect.bind(handler)); 
    router.get("/callback", handler.handleCallback.bind(handler));

    return router;
}