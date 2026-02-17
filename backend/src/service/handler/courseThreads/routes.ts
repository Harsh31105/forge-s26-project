import { Router } from "express";
import { CourseThreadHandler } from ".";

export function courseThreadRoutes(handler: CourseThreadHandler): Router {
  const router = Router();

  // GET + POST
  router.get("/:id/threads", (req, res) => handler.handleGet(req, res));
  router.post("/:id/threads", (req, res) => handler.handlePost(req, res));

  // PATCH + DELETE
  router.patch("/:course_review_id/threads/:course_thread_id", (req, res) =>
    handler.handlePatch(req, res)
  );
  
  router.delete("/:course_review_id/threads/:course_thread_id", (req, res) =>
    handler.handleDelete(req, res)
  );
  

  return router;
}
