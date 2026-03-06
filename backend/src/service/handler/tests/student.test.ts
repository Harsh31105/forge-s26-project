import request from "supertest";
import express, { Express } from "express";
import { StudentHandler } from "../student";
import type { StudentRepository } from "../../../storage/storage";
import {
    StudentPostInputType,
    StudentPatchInputType,
    Student
} from "../../../models/student";
import { validate as isUUID } from "uuid";
import { errorHandler } from "../../../errs/httpError";

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));

const mockValidate = isUUID as jest.Mock;

describe("StudentHandler Endpoints", () => {

    let app: Express;
    let repo: jest.Mocked<StudentRepository>;
    let handler: StudentHandler;

    beforeEach(() => {

        repo = {
            getStudents: jest.fn(),
            getStudentByID: jest.fn(),
            createStudent: jest.fn(),
            patchStudent: jest.fn(),
            deleteStudent: jest.fn(),
        } as unknown as jest.Mocked<StudentRepository>;

        handler = new StudentHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/students", handler.handleGet.bind(handler));
        app.get("/students/:id", handler.handleGetByID.bind(handler));
        app.post("/students", handler.handlePost.bind(handler));
        app.patch("/students/:id", handler.handlePatch.bind(handler));
        app.delete("/students/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);

        mockValidate.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const baseStudent = {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        graduationYear: 2026,
        preferences: []
    };

    describe("GET /students", () => {

        test("returns students", async () => {

            repo.getStudents.mockResolvedValue([
                {
                    ...baseStudent,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]);

            const res = await request(app).get("/students");
            expect(res.status).toBe(200);
            expect(res.body[0]).toMatchObject(baseStudent);
            expect(typeof res.body[0].createdAt).toBe("string");
        });

        test("repository error returns 500", async () => {

            repo.getStudents.mockRejectedValue(new Error());
            const res = await request(app).get("/students");
            expect(res.status).toBe(500);
        });

    });

    describe("GET /students/:id", () => {

        test("returns student by id", async () => {

            repo.getStudentByID.mockResolvedValue({
                ...baseStudent,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const res = await request(app).get("/students/1");

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(baseStudent);
        });

        test("invalid uuid returns 400", async () => {

            mockValidate.mockReturnValue(false);

            const res = await request(app).get("/students/1");
            expect(res.status).toBe(400);
        });

    });

    describe("POST /students", () => {

        test("creates student", async () => {
            const payload: StudentPostInputType = {
                firstName: "John",
                lastName: "Doe",
                email: "john@test.com",
                graduationYear: 2026,
                preferences: []
            };

            repo.createStudent.mockResolvedValue({
                id: "1",
                ...payload,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const res = await request(app)
                .post("/students")
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject(baseStudent);
        });

        test("invalid body returns 400", async () => {

            const res = await request(app)
                .post("/students")
                .send({ bad: "data" });

            expect(res.status).toBe(400);
        });

    });

    describe("PATCH /students/:id", () => {

        test("updates student", async () => {

            const patch: StudentPatchInputType = {
                firstName: "Updated"
            };

            repo.patchStudent.mockResolvedValue({
                ...baseStudent,
                firstName: "Updated",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const res = await request(app)
                .patch("/students/1")
                .send(patch);

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe("Updated");
        });

        test("invalid uuid returns 400", async () => {

            mockValidate.mockReturnValue(false);

            const res = await request(app)
                .patch("/students/1")
                .send({ firstName: "Updated" });

            expect(res.status).toBe(400);
        });

    });

    describe("DELETE /students/:id", () => {

        test("deletes student", async () => {

            repo.deleteStudent.mockResolvedValue(undefined);
            const res = await request(app).delete("/students/1");
            expect(res.status).toBe(204);
        });

        test("invalid uuid returns 400", async () => {

            mockValidate.mockReturnValue(false);
            const res = await request(app).delete("/students/1");
            expect(res.status).toBe(400);
        });

    });

});