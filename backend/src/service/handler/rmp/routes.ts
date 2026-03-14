import { Router } from "express";
import { RMPHandler } from "./index";

export function rmpRoutes(handler: RMPHandler): Router {
    const router = Router();

    // POST /rmp
    router.post("/", handler.handlePost.bind(handler));

    return router;
}