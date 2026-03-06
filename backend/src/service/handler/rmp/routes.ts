import { Router } from "express";
import { RMPHandler } from "./index";

export function rmpRoutes(handler: RMPHandler): Router {
    const router = Router();

    // POST /rmp
    router.post("/", handler.handlePost.bind(handler));

    return router;
}

export function professorRMPRoutes(handler: RMPHandler): Router {
    // so nested route can access the :id from the parent professor route
    const router = Router({ mergeParams: true });

    // GET /professors/:id/rmp
    router.get("/:id/rmp", handler.handleGet.bind(handler));

    return router;
}