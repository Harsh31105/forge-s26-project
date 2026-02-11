import type { CourseThreadRepository } from "../../../storage/storage";
import {
  CourseThread,
  CourseThreadPatchInputSchema,
  CourseThreadPatchInputType,
  CourseThreadPostInputSchema,
  CourseThreadPostInputType,
} from "../../../models/courseThread";
import { BadRequest, mapDBError } from "../../../errs/httpError";
import type { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class CourseThreadHandler {
  constructor(private readonly repo: CourseThreadRepository) {}

  async handleGet(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.id as string;
    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");

    try {
      const threads: CourseThread[] = await this.repo.getThreadsByCourseReviewId(courseReviewId);
      res.status(200).json(threads);
    } catch (err) {
      throw mapDBError(err, "failed to retrieve threads");
    }
  }

  async handlePost(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.id as string;
    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");

    const result = CourseThreadPostInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for post-thread");
    const input: CourseThreadPostInputType = result.data;

    try {
      const created = await this.repo.createThread(courseReviewId, input);
      res.status(201).json(created);
    } catch (err) {
      throw mapDBError(err, "failed to create thread");
    }
  }

  async handlePatch(req: Request, res: Response): Promise<void> {
    const courseReviewId = (req.params.course_id ?? req.params.id) as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    const result = CourseThreadPatchInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for patch-thread");
    const input: CourseThreadPatchInputType = result.data;

    try {
      const updated = await this.repo.patchThread(threadId, input);
      res.status(200).json(updated);
    } catch (err) {
      throw mapDBError(err, "failed to patch thread");
    }
  }

  async handleDelete(req: Request, res: Response): Promise<void> {
    const courseReviewId = (req.params.course_id ?? req.params.id) as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    try {
      await this.repo.deleteThread(threadId);
      res.sendStatus(204);
    } catch (err) {
      throw mapDBError(err, "failed to delete thread");
    }
  }
}
