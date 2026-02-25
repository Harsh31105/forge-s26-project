import type { ProfThreadRepository } from "../../../storage/storage";

import {
    ProfThread,
    ProfessorThreadPatchInputSchema,
    ProfessorThreadPatchInputType,
    ProfessorThreadPostInputSchema,
    ProfessorThreadPostInputType,
} from "../../../models/profThreads";
import { BadRequest, mapDBError } from "../../../errs/httpError";
import type { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class ProfThreadHandler {
    constructor(private readonly repo: ProfThreadRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
    const professorReviewId = req.params.id as string;
    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");

    try {
        const threads: ProfThread[] = await this.repo.getThreadsByProfReviewId(professorReviewId);
        res.status(200).json(threads);
    } catch (err) {
        throw mapDBError(err, "failed to retrieve threads");
    }
    }

    async handlePost(req: Request, res: Response): Promise<void> {
    const professorReviewId = req.params.id as string;
    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");

    const result = ProfessorThreadPostInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for post-thread");
    const input: ProfessorThreadPostInputType = result.data;

    try {
        const created = await this.repo.createThread(professorReviewId, input);
        res.status(201).json(created);
    } catch (err) {
        throw mapDBError(err, "failed to create thread");
    }
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
    const professorReviewId = (req.params.professor_id ?? req.params.id) as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    const result = ProfessorThreadPatchInputSchema.safeParse(req.body);
    if (!result.success) throw BadRequest("unable to parse input for patch-thread");
    const input: ProfessorThreadPatchInputType = result.data;

    try {
        const updated = await this.repo.patchThread(threadId, input);
        res.status(200).json(updated);
    } catch (err) {
        throw mapDBError(err, "failed to patch thread");
    }
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
    const professorReviewId = (req.params.professor_id ?? req.params.id) as string;
    const threadId = req.params.thread_id as string;

    if (!isUUID(professorReviewId)) throw BadRequest("invalid professor review id");
    if (!isUUID(threadId)) throw BadRequest("invalid thread id");

    try {
        await this.repo.deleteThread(threadId);
        res.sendStatus(204);
    } catch (err) {
        throw mapDBError(err, "failed to delete thread");
    }
  }
}