import request from "supertest";
import express, { Express } from "express";
import { TraceHandler } from "../trace";
import { TraceRepository } from "../../../storage/storage";
import { Trace } from "../../../models/trace";
import { errorHandler } from "../../../errs/httpError";

jest.setTimeout(30000);

describe("TraceHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<TraceRepository>;
    let handler: TraceHandler;

    const baseTrace: Trace = {
        id: 1,
        courseId: "111e8400-e29b-41d4-a716-446655440000",
        professorId: "222e8400-e29b-41d4-a716-446655440000",
        courseName: "Algorithms",
        departmentId: 1,
        courseCode: 5800,
        semester: "fall",
        lectureYear: 2024,
        lectureType: "lecture",
        howOftenPercentage: 75,
        hoursDevoted: 12,
        professorEfficiency: "4.25",
        eval: "Great course",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const makeTrace = (overrides?: Partial<Trace>): Trace => ({
        ...baseTrace,
        ...overrides,
        createdAt: overrides?.createdAt ?? new Date(),
        updatedAt: overrides?.updatedAt ?? new Date(),
    });

    beforeEach(() => {
        repo = {
            getTraces: jest.fn(),
        } as unknown as jest.Mocked<TraceRepository>;

        handler = new TraceHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/trace", handler.handleGet.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /trace", () => {
        test("returns traces", async () => {
            repo.getTraces.mockResolvedValue([makeTrace()]);

            const res = await request(app).get("/trace");

            expect(res.status).toBe(200);
            expect(res.body[0]).toMatchObject({
                id: baseTrace.id,
                courseId: baseTrace.courseId,
                professorId: baseTrace.professorId,
                courseName: baseTrace.courseName,
                departmentId: baseTrace.departmentId,
            });

            expect(typeof res.body[0].createdAt).toBe("string");
        });

        test("applies filters correctly", async () => {
            repo.getTraces.mockResolvedValue([makeTrace()]);

            const res = await request(app).get(
                `/trace?courseId=${baseTrace.courseId}&departmentId=1&semester=fall`
            );

            expect(res.status).toBe(200);
            expect(repo.getTraces).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    limit: 10,
                }),
                expect.objectContaining({
                    courseId: baseTrace.courseId,
                    departmentId: 1,
                    semester: "fall",
                })
            );
        });

        test("invalid query params return 400 (bad UUID)", async () => {
            const res = await request(app).get("/trace?courseId=not-a-uuid");

            expect(res.status).toBe(400);
            expect(repo.getTraces).not.toHaveBeenCalled();
        });

        test("invalid query params return 400 (bad departmentId)", async () => {
            const res = await request(app).get("/trace?departmentId=abc");

            expect(res.status).toBe(400);
            expect(repo.getTraces).not.toHaveBeenCalled();
        });

        test("repository error returns 500", async () => {
            repo.getTraces.mockRejectedValue(new Error("DB failure"));

            const res = await request(app).get("/trace");

            expect(res.status).toBe(500);
        });
    });
});