import { Router } from "express";
import { FavoriteHandler } from "./index";


export function favoritesRoutes(handler: FavoriteHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));

    return router;
}