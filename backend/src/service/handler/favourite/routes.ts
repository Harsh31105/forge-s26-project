import { FavouriteHandler } from "./index";
import { Router } from "express";

export function favouriteRoutes(handler: FavouriteHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));

    return router;
}