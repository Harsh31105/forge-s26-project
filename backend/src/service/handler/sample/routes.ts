import { Router } from "express";
import { SampleHandler } from "./index";
import { FavoritesHandler } from "../favorites";

export function sampleRoutes(handler: SampleHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));
    router.get("/:id", handler.handleGetByID.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.patch("/:id", handler.handlePatch.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));

    return router;
}

export function favoritesRoutes(handler: FavoritesHandler): Router {
    const router = Router();

    router.get("/", handler.handleGetFavorites.bind(handler));
    router.post("/", handler.handleAddFavorite.bind(handler));
    router.delete("/:id", handler.handleRemoveFavorite.bind(handler));

    return router;
}