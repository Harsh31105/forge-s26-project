import { Router } from "express";
import { AiSummaryHandler } from "./index";

export function aiSummaryRoutes(handler: AiSummaryHandler): Router {
    const router = Router();

    router.get("/popular", handler.handleGetPopular.bind(handler));

    return router;
}
