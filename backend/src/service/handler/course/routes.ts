import { Router } from "express";
import { CourseHandler } from "./index";

export function courseRoutes(handler: CourseHandler): Router {
    const router = Router();

    router.get("/", handler.handleGet.bind(handler));
    router.get("/:id", handler.handleGetByID.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.patch("/:id", handler.handlePatch.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));

    router.get("/:id/favourites", handler.handleGetStudentIDsWhoFavourited.bind(handler));
    router.get("/:id/best-professors", handler.handleGetBestProfessors.bind(handler)); // best prof endpoint route

    return router;
}