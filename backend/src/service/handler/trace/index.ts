import type { TraceRepository } from "../../../storage/storage";
import {
    Trace,
    TracePostInputSchema,
    TracePostInputType,
    TracePatchInputSchema,
    TracePatchInputType,
} from "../../../models/trace";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError,
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { getOffset, PaginationSchema } from "../../../utils/pagination";

export class TraceHandler {
    constructor(private readonly repo: TraceRepository) {}

    // GET
    async handleGet(req: Request, res: Response): Promise<void> {
        const paginationResult = PaginationSchema.safeParse(req.query);
        if (!paginationResult.success) throw BadRequest("Invalid pagination parameters");
        const pagination = paginationResult.data;

        const filters = {
            courseId: req.query.course_id as string | undefined,
            professorId: req.query.professor_id as string | undefined,
            departmentId: req.query.department_id as string | undefined,
        };

        let traces: Trace[];
        try {
            traces = await this.repo.getTraces(filters, pagination);
        } catch (err) {
            console.log("Failed to get traces:", err);
            throw mapDBError(err, "Failed to retrieve traces");
        }

        res.status(200).json(traces);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid ID was given");

        let trace: Trace;
        try {
            trace = await this.repo.getTraceByID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("Trace not found");
            throw mapDBError(err, "Failed to retrieve trace");
        }

        res.status(200).json(trace);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const parseResult = TracePostInputSchema.safeParse(req.body);
        if (!parseResult.success) throw BadRequest("unable to parse input for post-trace");

        const postTrace: TracePostInputType = parseResult.data;

        let newTrace: Trace;
        try {
            newTrace = await this.repo.createTrace(postTrace);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "Failed to create trace");
        }

        res.status(201).json(newTrace);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid ID was given");

        const parseResult = TracePatchInputSchema.safeParse(req.body);
        if (!parseResult.success) throw BadRequest("Unable to parse input for patch-trace");

        const patchTrace: TracePatchInputType = parseResult.data;

        let updatedTrace: Trace;
        try {
            updatedTrace = await this.repo.patchTrace(id, patchTrace);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "Failed to patch trace");
        }

        res.status(200).json(updatedTrace);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Invalid ID was given");

        try {
            await this.repo.deleteTrace(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "Failed to delete trace");
        }

        res.sendStatus(204);
    }
}