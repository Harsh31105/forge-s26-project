import type { ProfThreadRepository } from "../../../storage/storage";

import {
    ProfThread,
    ProfessorThreadPatchInputSchema,
    ProfessorThreadPatchInputType,
    ProfessorThreadPostInputSchema,
    ProfessorThreadPostInputType,
} from "../../../models/profThreads";
import { BadRequest, mapDBError } from "../../../errs/httpError";
import logger from "../../../utils/logger";
import type { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { PaginationSchema } from "../../../utils/pagination";
import { assessCensorship, CensorshipResult } from "../../../utils/censorship";

export class ProfThreadHandler {
    constructor(private readonly repo: ProfThreadRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {   
    const professorReviewId = req.params.id as string;
    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");

    const result = PaginationSchema.safeParse(req.query);
    if (!result.success) {
        throw BadRequest("Invalid pagination parameters");
    }
    const pagination = result.data;

    try {
        const threads: ProfThread[] = await this.repo.getThreadsByProfessorReviewId(professorReviewId, pagination);
        res.status(200).json(threads);
    } catch (err) {
        logger.error({ err }, "DB error in handleGet (professorThreads)");
        throw mapDBError(err, "failed to retrieve threads");
    }
    }

    async handlePost(req: Request, res: Response): Promise<void> {
    const professorReviewId = req.params.id as string;
    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");

    const result = ProfessorThreadPostInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for post-thread");
    const input: ProfessorThreadPostInputType = result.data;

    const censoredContent: CensorshipResult = assessCensorship(input.content);
    input.content = censoredContent.processedText;

    try {
        const created = await this.repo.createThread(professorReviewId, input);
        res.status(201).json(created);
    } catch (err) {
        logger.error({ err }, "DB error in handlePost (professorThreads)");
        throw mapDBError(err, "failed to create thread");
    }
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
    const professorReviewId = req.params.professor_id = req.params.id as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    const result = ProfessorThreadPatchInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for patch-thread");
    const input: ProfessorThreadPatchInputType = result.data;

    if (input.content) {
        const censortedContent: CensorshipResult = assessCensorship(input.content);
        input.content = censortedContent.processedText;
    }

    try {
        const updated = await this.repo.patchThread(threadId, input);
        res.status(200).json(updated);
    } catch (err) {
        logger.error({ err }, "DB error in handlePatch (professorThreads)");
        throw mapDBError(err, "failed to patch thread");
    }
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
    const professorReviewId = req.params.professor_id = req.params.id as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    try {
        await this.repo.deleteThread(threadId);
        res.sendStatus(204);
    } catch (err) {
        logger.error({ err }, "DB error in handleDelete (professorThreads)");
        throw mapDBError(err, "failed to delete thread");
    }
  }
}