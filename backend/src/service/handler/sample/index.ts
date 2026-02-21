import type { SampleRepository } from "../../../storage/storage";
import {
    Sample, SamplePatchInputSchema, SamplePatchInputType,
    SamplePostInputSchema,
    SamplePostInputType
} from "../../../models/sample";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { getOffset, PaginationSchema } from "../../../utils/pagination";

export class SampleHandler {
    constructor(private readonly repo: SampleRepository) {}

    async handleGet(req: Request, res: Response) :Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) {
            throw BadRequest("Invalid pagination parameters");
        }
        const pagination = result.data;
        
        let samples: Sample[];

        try {
            samples = await this.repo.getSamples(pagination.limit, getOffset(pagination));
        } catch (err) {
            console.log("Failed to get samples: ", err);
            throw mapDBError(err, "failed to retrieve samples");
        }

        res.status(200).json(samples);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        let sample: Sample;
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Empty ID cannot be given")

        try {
            sample = await this.repo.getSampleByID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) NotFound("sample not found");

            throw mapDBError(err, "failed to retrieve sample");
        }

        res.status(200).json(sample);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const result = SamplePostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for post-sample")
        }
        const postSample: SamplePostInputType = result.data;

        let newSample: Sample;
        try {
            newSample = await this.repo.createSample(postSample);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post sample");
        }

        res.status(201).json(newSample);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        const result = SamplePatchInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for patch-sample")
        }
        const patchSample: SamplePatchInputType = result.data;

        let updatedSample: Sample;
        try {
            updatedSample = await this.repo.patchSample(id, patchSample);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to patch sample");
        }

        res.status(200).json(updatedSample);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteSample(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete sample");
        }

        res.sendStatus(204);
    }
}