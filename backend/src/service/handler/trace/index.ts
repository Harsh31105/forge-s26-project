import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import type { TraceRepository } from "../../../storage/storage";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { PaginationSchema } from "../../../utils/pagination";
import {
    TracePatchInputSchema,
    TracePostInputSchema,
} from "../../../models/trace";

export class TraceHandler {
    constructor(private readonly repo: TraceRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) throw BadRequest("Invalid pagination parameters");

        try {
            const traces = await this.repo.getTraces(result.data);
            res.status(200).json(traces);
        } catch (err) {
            throw mapDBError(err, "Failed to retrieve traces");
        }
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid trace ID");

        try {
            const trace = await this.repo.getTraceByID(id);
            res.status(200).json(trace);
        } catch (err) {
            if (err instanceof NotFoundError) throw NotFound("Trace not found");
            throw mapDBError(err, "Failed to retrieve trace");
        }
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const result = TracePostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input for trace POST");

        try {
            const newTrace = await this.repo.createTrace(result.data);
            res.status(201).json(newTrace);
        } catch (err) {
            throw mapDBError(err, "Failed to create trace");
        }
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid trace ID");

        const result = TracePatchInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("Unable to parse input for trace PATCH");

        try {
            const updatedTrace = await this.repo.patchTrace(id, result.data);
            res.status(200).json(updatedTrace);
        } catch (err) {
            if (err instanceof NotFoundError) throw NotFound("Trace not found");
            throw mapDBError(err, "Failed to patch trace");
        }
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid trace ID");

        try {
            await this.repo.deleteTrace(id);
            res.sendStatus(204);
        } catch (err) {
            if (err instanceof NotFoundError) throw NotFound("Trace not found");
            throw mapDBError(err, "Failed to delete trace");
        }
    }
}