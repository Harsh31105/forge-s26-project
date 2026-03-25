import { Router } from "express";
import { ProfThreadHandler } from "./index";

export function professorThreadRoutes(handler: ProfThreadHandler): Router {
  const router = Router();

  // /professor-reviews/:id/threads
  router.get("/:id/threads", handler.handleGet.bind(handler));
  router.post("/:id/threads", handler.handlePost.bind(handler));

  // /professor-reviews/:prof_id/threads/:thread_id
  router.patch("/:professor_review_id/threads/:thread_id", (req, res) =>
    handler.handlePatch(req, res)
  );
  router.delete("/:professor_review_id/threads/:thread_id", (req, res) =>
    handler.handleDelete(req, res)
  );

  return router;
}

