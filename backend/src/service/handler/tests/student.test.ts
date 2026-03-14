import request from "supertest";
import express, { Express } from "express";
import { StudentHandler } from "../student";
import { StudentRepository } from "../../../storage/storage";
import {
    StudentPostInputType,
    StudentPatchInputType,
    Student
} from "../../../models/student";
import { validate as isUUID } from "uuid";
import { errorHandler } from "../../../errs/httpError";
jest.setTimeout(30000);

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

    const baseStudent: Student = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        graduationYear: null,
        preferences: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const makeStudent = (overrides?: Partial<Student>): Student => ({
        id: overrides?.id ?? baseStudent.id,
        firstName: overrides?.firstName ?? baseStudent.firstName,
        lastName: overrides?.lastName ?? baseStudent.lastName,
        email: overrides?.email ?? baseStudent.email,
        graduationYear: overrides?.graduationYear ?? null,
        preferences: overrides?.preferences ?? [],
        createdAt: overrides?.createdAt ?? new Date(),
        updatedAt: overrides?.updatedAt ?? new Date(),
    });

    describe("Invalid Pagination Parameter", () => {
        test("invalid pagination query return 400", async () => {
            const res = await request(app).get("/students?limit=abc");
            expect(res.status).toBe(400);
            expect(repo.getStudents).not.toHaveBeenCalled();
        });
    });

    describe("GET /students", () => {
        test("returns students", async () => {
            repo.getStudents.mockResolvedValue([makeStudent()]);

            const res = await request(app).get("/students");
            expect(res.status).toBe(200);
            expect(res.body[0]).toMatchObject({
                id: baseStudent.id,
                firstName: baseStudent.firstName,
                lastName: baseStudent.lastName,
                email: baseStudent.email,
                graduationYear: baseStudent.graduationYear,
                preferences: baseStudent.preferences
            });
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
            repo.getStudentByID.mockResolvedValue(makeStudent());

            const res = await request(app).get("/students/1");

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: baseStudent.id,
                firstName: baseStudent.firstName,
                lastName: baseStudent.lastName,
                email: baseStudent.email,
                graduationYear: baseStudent.graduationYear,
                preferences: baseStudent.preferences
            });
        });

        test("invalid uuid returns 400", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).get("/students/1");
            expect(res.status).toBe(400);
        });
    });

    describe("POST /students", () => {
        test("creates student", async () => {

            const payload = {
                firstName: "John",
                lastName: "Doe",
                email: "john@test.com",
                preferences: []
            };

            repo.createStudent.mockResolvedValue(makeStudent());

            const res = await request(app)
                .post("/students")
                .set("Content-Type", "application/json")
                .send(payload);

            expect(res.status).toBe(201);

            expect(res.body).toMatchObject({
                firstName: "John",
                lastName: "Doe",
                email: "john@test.com",
                preferences: []
            });
        });
    });

    describe("PATCH /students/:id", () => {
        test("updates student", async () => {
            const patch: StudentPatchInputType = { firstName: "Updated" };

            repo.patchStudent.mockResolvedValue(makeStudent({ firstName: "Updated" }));

            const res = await request(app).patch("/students/1").send(patch);

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe("Updated");
        });

        test("invalid uuid returns 400", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).patch("/students/1").send({ firstName: "Updated" });
            expect(res.status).toBe(400);
        });

        test("invalid body returns 400", async () => {
            const res = await request(app).patch("/students/1").send({ graduationYear: "not-a-number" });
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