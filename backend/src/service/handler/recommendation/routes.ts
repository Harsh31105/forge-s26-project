import { Router } from "express";
import { RecommendationHandler } from "./index";

export function recommendationRoutes(handler: RecommendationHandler): Router {
    const router = Router();

    router.post("/", handler.handleGetRecommendations.bind(handler));
    router.post("/ml", handler.handleGetMLRecommendations.bind(handler));

    return router;
}
