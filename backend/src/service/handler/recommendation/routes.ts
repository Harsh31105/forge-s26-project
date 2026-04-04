import { Router } from "express";
import { RecommendationHandler } from "./index";

export function recommendationRoutes(handler: RecommendationHandler): Router {
    const router = Router();

    router.get("/:studentId", handler.handleGetRecommendations.bind(handler));

    return router;
}
