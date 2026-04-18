import { Router } from "express";
import { AiSummaryHandler } from "./index";

export function aiSummaryRoutes(handler: AiSummaryHandler): Router {
    const router = Router();

    // GET /ai-summaries/popular?limit=5
    router.get("/popular", handler.handleGetPopular.bind(handler));

    return router;
}
