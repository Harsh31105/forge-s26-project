import { Router } from "express";
import { CourseReviewHandler } from "./index";


export function courseReviewRoutes(handler: CourseReviewHandler): Router {
    const router = Router();
  
    router.get("/", handler.handleGet.bind(handler));
    router.get("/:id", handler.handleGetByID.bind(handler));
    router.post("/", handler.handlePost.bind(handler));
    router.patch("/:id", handler.handlePatch.bind(handler));
    router.delete("/:id", handler.handleDelete.bind(handler));
  
    return router;
  }