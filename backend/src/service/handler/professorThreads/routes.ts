import { Router } from "express";
import { ProfThreadHandler } from "./index";

export function professorThreadRoutes(handler: ProfThreadHandler): Router {
  const router = Router();

  // /prof-reviews/:id/threads
  router.get("/", handler.handleGet.bind(handler));
  router.post("/", handler.handlePost.bind(handler));

  // /prof-reviews/:prof_id/threads/:thread_id
  router.patch("/:thread_id", (req, res, next) =>
    handler.handlePatch(req, res).catch(next)
  );
  router.delete("/:thread_id", (req, res, next) =>
    handler.handleDelete(req, res).catch(next)
  );

  return router;
}

