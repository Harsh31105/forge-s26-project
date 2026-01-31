import type { SampleRepository } from "../../../storage/storage";
import {
    Sample, SamplePatchInputSchema, SamplePatchInputType,
    SamplePostInputSchema,
    SamplePostInputType
} from "../../../models/sample";
import {BadRequest, InternalServerError} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class SampleHandler {
    constructor(private readonly repo: SampleRepository) {}

    async handleGet(req: Request, res: Response) :Promise<void> {
        let samples: Sample[];

        try {
            samples = await this.repo.getSamples();
        } catch (err) {
            console.log("Failed to get samples: ", err);
            throw InternalServerError("failed to retrieve samples");
        }

        res.status(200).json(samples);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        let sample: Sample;
        const id = Number(req.params.id);
        if (isNaN(id) || !isUUID(id)) throw BadRequest("Empty ID cannot be given")

        try {
            sample = await this.repo.getSampleByID(id);
        } catch (err) {
            console.log(err);
            // TODO: If Not Found, throw not found error. Else, Internal-500.

            throw InternalServerError("failed to retrieve sample");
        }

        res.status(200).json(sample);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        let postSample: SamplePostInputType;
        postSample = SamplePostInputSchema.safeParse(req.body);

        let newSample: Sample;
        try {
            newSample = await this.repo.createSample(postSample);
        } catch (err) {
            console.log(err);
            throw InternalServerError("failed to post sample");
        }

        res.status(201).json(newSample);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        if (isNaN(id) || !isUUID(id)) throw BadRequest("invalid ID given");

        let patchSample: SamplePatchInputType;
        patchSample = SamplePatchInputSchema.safeParse(req.body);

        let updatedSample: Sample;
        try {
            updatedSample = await this.repo.patchSample(id, patchSample);
        } catch (err) {
            console.log(err);
            throw InternalServerError("failed to patch sample");
        }

        res.status(200).json(updatedSample);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        if (isNaN(id) || !isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteSample(id);
        } catch (err) {
            console.log(err);
            throw InternalServerError("failed to delete sample");
        }

        res.sendStatus(204);
    }
}