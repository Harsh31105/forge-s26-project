import { Router } from "express";
import { TraceHandler } from "./index";

export function traceRoutes(handler: TraceHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));
    router.get("/offer-history", handler.handleGetOfferHistory.bind(handler));

    return router;
}