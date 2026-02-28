import request from "supertest";
import express, { Express } from "express";
import { SampleHandler } from "../sample";
import type { SampleRepository } from "../../../storage/storage";
import { SamplePostInputType, SamplePatchInputType, Sample } from "../../../models/student";
import { validate as isUUID } from "uuid";
import {errorHandler} from "../../../errs/httpError";

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));
const mockValidate = isUUID as jest.Mock;

describe("SampleHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<SampleRepository>;
    let handler: SampleHandler;

    beforeEach(() => {
        repo = {
            getSamples: jest.fn(),
            getSampleByID: jest.fn(),
            createSample: jest.fn(),
            patchSample: jest.fn(),
            deleteSample: jest.fn(),
        } as unknown as jest.Mocked<SampleRepository>;

        handler = new SampleHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/samples", handler.handleGet.bind(handler));
        app.get("/samples/:id", handler.handleGetByID.bind(handler));
        app.post("/samples", handler.handlePost.bind(handler));
        app.patch("/samples/:id", handler.handlePatch.bind(handler));
        app.delete("/samples/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /samples", () => {
        test("returns all samples", async () => {
            const data: Sample[] = [{ id: "1", name: "Sample 1" } as Sample];
            repo.getSamples.mockResolvedValue(data);

            const res = await request(app).get("/samples");
            expect(res.status).toBe(200);
            expect(res.body).toEqual(data);
        });

        test("repository throws error", async () => {
            repo.getSamples.mockRejectedValue(new Error("DB error"));
            const res = await request(app).get("/samples");
            expect(res.status).toBe(500);
        });
    });

    describe("GET /samples/:id", () => {
        test("returns sample by ID", async () => {
            const sample: Sample = { id: "1", name: "Sample 1" } as Sample;
            repo.getSampleByID.mockResolvedValue(sample);
            mockValidate.mockReturnValue(true);

            const res = await request(app).get("/samples/1");
            expect(res.status).toBe(200);
            expect(res.body).toEqual(sample);
        });

        test("Invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).get("/samples/1");
            expect(res.status).toBe(400);
        });
    });

    describe("POST /samples", () => {
        test("creates sample", async () => {
            const payload: SamplePostInputType = { name: "New Sample" };
            const createdSample: Sample = { id: "2", ...payload } as Sample;
            repo.createSample.mockResolvedValue(createdSample);

            const res = await request(app).post("/samples").send(payload);
            expect(res.status).toBe(201);
            expect(res.body).toEqual(createdSample);
        });

        test("invalid input", async () => {
            const payload = { invalid: "bad" };
            const res = await request(app).post("/samples").send(payload);
            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /samples/:id", () => {
        test("updates sample", async () => {
            const patch: SamplePatchInputType = { name: "Updated" };
            const updated: Sample = { id: "1", ...patch } as Sample;
            repo.patchSample.mockResolvedValue(updated);
            mockValidate.mockReturnValue(true);

            const res = await request(app).patch("/samples/1").send(patch);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updated);
        });

        test("invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const patch: SamplePatchInputType = { name: "Updated" };
            const res = await request(app).patch("/samples/1").send(patch);
            expect(res.status).toBe(400);
        });
    });

    describe("DELETE /samples/:id", () => {
        test("deletes sample", async () => {
            repo.deleteSample.mockResolvedValue(undefined);
            mockValidate.mockReturnValue(true);

            const res = await request(app).delete("/samples/1");
            expect(res.status).toBe(204);
        });

        test("invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).delete("/samples/1");
            expect(res.status).toBe(400);
        });
    });
});
