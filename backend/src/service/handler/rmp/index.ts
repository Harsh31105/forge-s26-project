import type { RMPRepository } from "../../../storage/storage";
import {
    RMP,
    RMPPostInputSchema,
    RMPPostInputType
} from "../../../models/rmp";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class RMPHandler {
    constructor(private readonly repo: RMPRepository) {}

    // GET /professors/:id/rmp - get RMP data for a professor
    async handleGet(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid professor ID was given");

        let rmpData: RMP;
        try {
            rmpData = await this.repo.getRMPByProfessorID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("RMP data not found for given professor");
            throw mapDBError(err, "failed to retrieve RMP data");
        }

        res.status(200).json(rmpData);
    }

    // POST /rmp - save RMP data for a professor
    async handlePost(req: Request, res: Response): Promise<void> {
        const result = RMPPostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for post-rmp");
        }
        const postRMP: RMPPostInputType = result.data;

        let newRMP: RMP;
        try {
            newRMP = await this.repo.postRMP(postRMP);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post RMP data");
        }

        res.status(201).json(newRMP);
    }
}