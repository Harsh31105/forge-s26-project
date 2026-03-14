import request from "supertest";
import express, { Express } from "express";
import { RMPHandler } from "../rmp";
import type { ProfessorRepository } from "../../../storage/storage";
import { RMP } from "../../../models/rmp";
import { errorHandler } from "../../../errs/httpError";

describe("RMPHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<ProfessorRepository>;
    let handler: RMPHandler;

    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        repo = {
            getProfessors: jest.fn(),
            getProfessorByID: jest.fn(),
            createProfessor: jest.fn(),
            patchProfessor: jest.fn(),
            deleteProfessor: jest.fn(),
            getRMPByProfessorID: jest.fn(),
            postRMP: jest.fn(),
        } as unknown as jest.Mocked<ProfessorRepository>;

        handler = new RMPHandler(repo);

        app = express();
        app.use(express.json());

        // POST /rmp
        app.post("/rmp", (req, res, next) =>
            handler.handlePost(req, res).catch(next)
        );

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // post /rmp
    // returns bulk RMP data and 201
    // repo error returns 500

    describe("POST /rmp", () => {
        test("returns bulk RMP data and 201", async () => {
            const mockRMPData: RMP[] = [
                {
                    id: 1,
                    professorId: "11111111-1111-1111-1111-111111111111",
                    ratingAvg: "4.50",
                    ratingWta: 85,
                    avgDifficulty: "3.20",
                    createdAt: new Date("2026-01-15T10:30:00Z"),
                    updatedAt: new Date("2026-01-15T10:30:00Z"),
                }
            ];
            repo.postRMP.mockResolvedValue(mockRMPData);

            const res = await request(app).post("/rmp");
            expect(res.status).toBe(201);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].professorId).toBe("11111111-1111-1111-1111-111111111111");
        });

        test("repo error returns 500", async () => {
            repo.postRMP.mockRejectedValue(new Error("DB error"));
            const res = await request(app).post("/rmp");
            expect(res.status).toBe(500);
        });
    });
});