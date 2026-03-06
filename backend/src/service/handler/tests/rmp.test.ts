import request from "supertest";
import express, { Express } from "express";
import { RMPHandler } from "../rmp";
import type { RMPRepository } from "../../../storage/storage";
import { RMP } from "../../../models/rmp";
import { validate as isUUID } from "uuid";
import { errorHandler, NotFoundError } from "../../../errs/httpError";
// referenced course.test.ts structure for GET test

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));
const mockValidate = isUUID as jest.Mock;

const mockRMP: RMP = {
    id: 1,
    professorId: "11111111-1111-1111-1111-111111111111",
    ratingAvg: "4.50",
    ratingWta: 85,
    avgDifficulty: "3.20",
    createdAt: new Date("2026-01-15T10:30:00Z"),
    updatedAt: new Date("2026-01-15T10:30:00Z"),
};

describe("RMPHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<RMPRepository>;
    let handler: RMPHandler;

    beforeEach(() => {
        repo = {
            getRMPByProfessorID: jest.fn(),
            postRMP: jest.fn(),
        } as unknown as jest.Mocked<RMPRepository>;

        handler = new RMPHandler(repo);

        app = express();
        app.use(express.json());

        // GET /professors/:id/rmp
        app.get("/professors/:id/rmp", (req, res, next) =>
            handler.handleGet(req, res).catch(next)
        );

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /professors/:id/rmp", () => {
        test("returns RMP data for a professor", async () => {
            repo.getRMPByProfessorID.mockResolvedValue(mockRMP);
            mockValidate.mockReturnValue(true);

            const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: 1,
                professorId: "11111111-1111-1111-1111-111111111111",
                ratingAvg: "4.50",
                ratingWta: 85,
                avgDifficulty: "3.20",
            });
            expect(repo.getRMPByProfessorID).toHaveBeenCalledWith(
                "11111111-1111-1111-1111-111111111111"
            );
        });

        test("invalid UUID returns 400", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).get("/professors/not-a-uuid/rmp");
            expect(res.status).toBe(400);
        });

        test("professor has no RMP data returns 404", async () => {
            repo.getRMPByProfessorID.mockRejectedValue(
                new NotFoundError("RMP data not found for given professor ID")
            );
            mockValidate.mockReturnValue(true);

            const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
            expect(res.status).toBe(404);
        });

        test("repo error returns 500", async () => {
            repo.getRMPByProfessorID.mockRejectedValue(new Error("DB error"));
            mockValidate.mockReturnValue(true);

            const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
            expect(res.status).toBe(500);
        });
    });
});