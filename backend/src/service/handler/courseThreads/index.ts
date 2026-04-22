import type { AiSummaryRepository, CourseThreadRepository } from "../../../storage/storage";
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
import { PaginationSchema } from "../../../utils/pagination";
import { assessCensorship, CensorshipResult } from "../../../utils/censorship";

const STALE_THRESHOLD = 0.25;

export class CourseThreadHandler {
  constructor(
    private readonly repo: CourseThreadRepository,
    private readonly aiSummaryRepo: AiSummaryRepository,
  ) {}

  async handleGet(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.id as string;
    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");

    const result = PaginationSchema.safeParse(req.query);
    if (!result.success) {
      throw BadRequest("Invalid pagination parameters");
    }
    const pagination = result.data;

    try {
      const threads: CourseThread[] = await this.repo.getThreadsByCourseReviewId(courseReviewId, pagination);
      res.status(200).json(threads);
    } catch (err) {
      console.error("DB error in handleGet (courseThreads):", err);
      throw mapDBError(err, "failed to retrieve threads");
    }
  }

  async handlePost(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.id as string;
    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");

    const result = CourseThreadPostInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for post-thread");
    const input: CourseThreadPostInputType = result.data;

    const censoredContent: CensorshipResult = assessCensorship(input.content);
    input.content = censoredContent.processedText;

    try {
      const created = await this.repo.createThread(courseReviewId, input);
      res.status(201).json(created);
      this.aiSummaryRepo
        .markStaleIfThresholdMet(courseReviewId, "course", STALE_THRESHOLD)
        .catch(err => console.error("Failed to check AI summary staleness:", err));
    } catch (err) {
      console.error("DB error in handlePost (courseThreads):", err);
      throw mapDBError(err, "failed to create thread");
    }
  }

  async handlePatch(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.course_review_id as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    const result = CourseThreadPatchInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for patch-thread");
    const input: CourseThreadPatchInputType = result.data;

    if (input.content) {
      const censortedContent: CensorshipResult = assessCensorship(input.content);
      input.content = censortedContent.processedText;
    }

    try {
      const updated = await this.repo.patchThread(threadId, input);
      res.status(200).json(updated);
    } catch (err) {
      console.error("DB error in handlePatch (courseThreads):", err);
      throw mapDBError(err, "failed to patch thread");
    }
  }

  async handleDelete(req: Request, res: Response): Promise<void> {
    const courseReviewId = req.params.course_review_id as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(courseReviewId)) throw BadRequest("invalid course review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    try {
      await this.repo.deleteThread(threadId);
      res.sendStatus(204);
    } catch (err) {
      console.error("DB error in handleDelete (courseThreads):", err);
      throw mapDBError(err, "failed to delete thread");
    }
  }
}
