import request from "supertest";
import express, { Express } from "express";
import { errorHandler } from "../../../errs/httpError";
import { TraceHandler } from "../trace";
import type { TraceRepository } from "../../../storage/storage";
import type { Trace } from "../../../models/trace";

describe("TraceHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<TraceRepository>;
    let handler: TraceHandler;

    const baseTrace: Trace = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        courseId: undefined,
        professorId: undefined,
        departmentId: undefined,
        action: "created review",
        timestamp: new Date("2026-03-20T19:00:00.000Z"),
    };

    const makeTrace = (overrides?: Partial<Trace>): Trace => ({
        ...baseTrace,
        ...overrides,
    });

    beforeEach(() => {
        repo = {
            getTraces: jest.fn(),
            getTraceByID: jest.fn(),
            createTrace: jest.fn(),
            patchTrace: jest.fn(),
            deleteTrace: jest.fn(),
        } as unknown as jest.Mocked<TraceRepository>;

        handler = new TraceHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/traces", handler.handleGet.bind(handler));
        app.get("/traces/:id", handler.handleGetByID.bind(handler));
        app.post("/traces", handler.handlePost.bind(handler));
        app.patch("/traces/:id", handler.handlePatch.bind(handler));
        app.delete("/traces/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("GET /traces returns traces", async () => {
        repo.getTraces.mockResolvedValue([makeTrace()]);

        const res = await request(app).get("/traces?page=1&limit=10");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].action).toBe("created review");
    });

    test("POST /traces creates trace", async () => {
        repo.createTrace.mockResolvedValue(makeTrace());

        const payload = {
            action: "created review",
            timestamp: "2026-03-20T19:00:00.000Z",
        };

        const res = await request(app).post("/traces").send(payload);

        expect(res.status).toBe(201);
        expect(res.body.action).toBe("created review");
    });

    test("GET /traces/:id returns trace", async () => {
        repo.getTraceByID.mockResolvedValue(makeTrace());

        const res = await request(app).get("/traces/550e8400-e29b-41d4-a716-446655440000");

        expect(res.status).toBe(200);
        expect(res.body.action).toBe("created review");
    });

    test("PATCH /traces/:id updates trace", async () => {
        repo.patchTrace.mockResolvedValue(makeTrace({ action: "updated review" }));

        const res = await request(app)
            .patch("/traces/550e8400-e29b-41d4-a716-446655440000")
            .send({ action: "updated review" });

        expect(res.status).toBe(200);
        expect(res.body.action).toBe("updated review");
    });

    test("DELETE /traces/:id deletes trace", async () => {
        repo.deleteTrace.mockResolvedValue(undefined);

        const res = await request(app).delete("/traces/550e8400-e29b-41d4-a716-446655440000");

        expect(res.status).toBe(204);
    });
});