import { Router } from "express";
import { CourseThreadHandler } from "./index";

export function courseThreadRoutes(handler: CourseThreadHandler): Router {
  const router = Router();

  // /course-reviews/:id/threads
  router.get("/", handler.handleGet.bind(handler));
  router.post("/", handler.handlePost.bind(handler));

  // /course-reviews/:course_id/threads/:thread_id
  router.patch("/:thread_id", (req, res, next) =>
    handler.handlePatch(req, res).catch(next)
  );
  router.delete("/:thread_id", (req, res, next) =>
    handler.handleDelete(req, res).catch(next)
  );

  return router;
}
