import request from "supertest";
import express, { Express } from "express";
import { AcademicHandler } from "../academic";
import { AcademicRepository } from "../../../storage/storage";
import { errorHandler } from "../../../errs/httpError";
import type { Major, Minor, Concentration } from "../../../models/student";

jest.setTimeout(30000);

describe("AcademicHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<AcademicRepository>;
    let handler: AcademicHandler;

    const mockMajors: Major[] = [
        { id: 1, name: "Computer Science" },
        { id: 2, name: "Data Science" },
    ];

    const mockConcentrations: Concentration[] = [
        { id: 1, name: "Artificial Intelligence" },
        { id: 2, name: "Cybersecurity" },
    ];

    const mockMinors: Minor[] = [
        { id: 1, name: "Mathematics" },
        { id: 2, name: "Statistics" },
    ];

    beforeEach(() => {
        repo = {
            getMajors: jest.fn(),
            getConcentrations: jest.fn(),
            getMinors: jest.fn(),
            getStudentMajors: jest.fn(),
            getStudentConcentrations: jest.fn(),
            getStudentMinors: jest.fn(),
            getMajorsForStudents: jest.fn(),
            getConcentrationsForStudents: jest.fn(),
            getMinorsForStudents: jest.fn(),
            addStudentMajor: jest.fn(),
            deleteStudentMajor: jest.fn(),
            addStudentConcentration: jest.fn(),
            deleteStudentConcentration: jest.fn(),
            addStudentMinor: jest.fn(),
            deleteStudentMinor: jest.fn(),
        } as jest.Mocked<AcademicRepository>;

        handler = new AcademicHandler(repo);

        app = express();
        app.use(express.json());
        app.get("/academic/majors", handler.handleGetMajors.bind(handler));
        app.get("/academic/concentrations", handler.handleGetConcentrations.bind(handler));
        app.get("/academic/minors", handler.handleGetMinors.bind(handler));
        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /academic/majors", () => {
        test("returns list of majors with status 200", async () => {
            repo.getMajors.mockResolvedValue(mockMajors);

            const res = await request(app).get("/academic/majors");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toMatchObject({ id: 1, name: "Computer Science" });
            expect(res.body[1]).toMatchObject({ id: 2, name: "Data Science" });
            expect(repo.getMajors).toHaveBeenCalledTimes(1);
        });

        test("returns empty array when no majors exist", async () => {
            repo.getMajors.mockResolvedValue([]);

            const res = await request(app).get("/academic/majors");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test("repository error returns 500", async () => {
            repo.getMajors.mockRejectedValue(new Error("DB connection failed"));

            const res = await request(app).get("/academic/majors");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /academic/concentrations", () => {
        test("returns list of concentrations with status 200", async () => {
            repo.getConcentrations.mockResolvedValue(mockConcentrations);

            const res = await request(app).get("/academic/concentrations");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toMatchObject({ id: 1, name: "Artificial Intelligence" });
            expect(res.body[1]).toMatchObject({ id: 2, name: "Cybersecurity" });
            expect(repo.getConcentrations).toHaveBeenCalledTimes(1);
        });

        test("returns empty array when no concentrations exist", async () => {
            repo.getConcentrations.mockResolvedValue([]);

            const res = await request(app).get("/academic/concentrations");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test("repository error returns 500", async () => {
            repo.getConcentrations.mockRejectedValue(new Error("DB connection failed"));

            const res = await request(app).get("/academic/concentrations");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /academic/minors", () => {
        test("returns list of minors with status 200", async () => {
            repo.getMinors.mockResolvedValue(mockMinors);

            const res = await request(app).get("/academic/minors");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toMatchObject({ id: 1, name: "Mathematics" });
            expect(res.body[1]).toMatchObject({ id: 2, name: "Statistics" });
            expect(repo.getMinors).toHaveBeenCalledTimes(1);
        });

        test("returns empty array when no minors exist", async () => {
            repo.getMinors.mockResolvedValue([]);

            const res = await request(app).get("/academic/minors");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test("repository error returns 500", async () => {
            repo.getMinors.mockRejectedValue(new Error("DB connection failed"));

            const res = await request(app).get("/academic/minors");

            expect(res.status).toBe(500);
        });
    });
});