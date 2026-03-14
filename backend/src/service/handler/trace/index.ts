import type { TraceRepository } from "../../../storage/storage";
import {
    Trace,
    TracePostInputSchema,
    TracePostInputType,
    TracePatchInputSchema,
    TracePatchInputType,
} from "../../../models/trace";
import {
    BadRequest
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { getOffset, PaginationSchema } from "../../../utils/pagination";

export class TraceHandler {
    constructor(private readonly repo: TraceRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) throw BadRequest("Invalid pagination parameters");

        const pagination = result.data;

        const filters = {
            course_id: req.query.course_id as string | undefined,
            professor_id: req.query.professor_id as string | undefined,
            department_id: req.query.department_id as string | undefined,
        };

        const traces = await this.repo.getTraces(filters, pagination);
        res.status(200).json(traces);
    }
}