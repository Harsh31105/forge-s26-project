"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleHandler = void 0;
const sample_1 = require("../../../models/sample");
const httpError_1 = require("../../../errs/httpError");
const uuid_1 = require("uuid");
class SampleHandler {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async handleGet(req, res) {
        let samples;
        try {
            samples = await this.repo.getSamples();
        }
        catch (err) {
            console.log("Failed to get samples: ", err);
            throw (0, httpError_1.InternalServerError)("failed to retrieve samples");
        }
        res.status(200).json(samples);
    }
    async handleGetByID(req, res) {
        let sample;
        const id = req.params.id;
        if (!(0, uuid_1.validate)(id))
            throw (0, httpError_1.BadRequest)("Empty ID cannot be given");
        try {
            sample = await this.repo.getSampleByID(id);
        }
        catch (err) {
            console.log(err);
            if (err instanceof httpError_1.NotFoundError)
                (0, httpError_1.NotFound)("sample not found");
            throw (0, httpError_1.InternalServerError)("failed to retrieve sample");
        }
        res.status(200).json(sample);
    }
    async handlePost(req, res) {
        const result = sample_1.SamplePostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw (0, httpError_1.BadRequest)("unable to parse input for post-sample");
        }
        const postSample = result.data;
        let newSample;
        try {
            newSample = await this.repo.createSample(postSample);
        }
        catch (err) {
            console.log(err);
            throw (0, httpError_1.InternalServerError)("failed to post sample");
        }
        res.status(201).json(newSample);
    }
    async handlePatch(req, res) {
        const id = req.params.id;
        if (!(0, uuid_1.validate)(id))
            throw (0, httpError_1.BadRequest)("invalid ID was given");
        const result = sample_1.SamplePatchInputSchema.safeParse(req.body);
        if (!result.success) {
            throw (0, httpError_1.BadRequest)("unable to parse input for patch-sample");
        }
        const patchSample = result.data;
        let updatedSample;
        try {
            updatedSample = await this.repo.patchSample(id, patchSample);
        }
        catch (err) {
            console.log(err);
            throw (0, httpError_1.InternalServerError)("failed to patch sample");
        }
        res.status(200).json(updatedSample);
    }
    async handleDelete(req, res) {
        const id = req.params.id;
        if (!(0, uuid_1.validate)(id))
            throw (0, httpError_1.BadRequest)("invalid ID was given");
        try {
            await this.repo.deleteSample(id);
        }
        catch (err) {
            console.log(err);
            throw (0, httpError_1.InternalServerError)("failed to delete sample");
        }
        res.sendStatus(204);
    }
}
exports.SampleHandler = SampleHandler;
//# sourceMappingURL=index.js.map