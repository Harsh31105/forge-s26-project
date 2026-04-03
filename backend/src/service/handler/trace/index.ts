import {PaginationSchema} from "../../../utils/pagination";
import {BadRequest, mapDBError} from "../../../errs/httpError";
import {Trace, TraceFilterSchema} from "../../../models/trace";
import { Request, Response } from "express";
import {TraceRepository} from "../../../storage/storage";

export class TraceHandler {
    constructor(private readonly repo: TraceRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) throw BadRequest("Invalid pagination parameters");
        const pagination = result.data;

        const queryParams = TraceFilterSchema.safeParse(req.query);
        if (!queryParams.success) throw BadRequest("Invalid queryparam parameters for trace");
        const filters = queryParams.data;

        let traces: Trace[]
        try {
            traces = await this.repo.getTraces(pagination, filters);
        } catch (err) {
            console.error("DB Error in get traces: ", err);
            throw mapDBError(err, "failed to retrieve traces");
        }

        res.status(200).json(traces);
    }
}