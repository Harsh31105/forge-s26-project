import request from "supertest";
import express, { Express } from "express";
import multer from "multer";
import { StudentHandler } from "../student";
import { AcademicRepository, ProfilePictureRepository, StudentRepository } from "../../../storage/storage";
import {
    StudentPatchInputType,
    Student
} from "../../../models/student";
import { validate as isUUID } from "uuid";
import { errorHandler, NotFoundError } from "../../../errs/httpError";

jest.setTimeout(30000);

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));

const mockValidate = isUUID as jest.Mock;
const upload = multer({ storage: multer.memoryStorage() });

describe("StudentHandler Endpoints", () => {

    let app: Express;
    let repo: jest.Mocked<StudentRepository>;
    let academicRepo: jest.Mocked<AcademicRepository>;
    let profilePictureRepo: jest.Mocked<ProfilePictureRepository>;
    let handler: StudentHandler;

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
        profilePictureKey: overrides?.profilePictureKey ?? null,
        createdAt: overrides?.createdAt ?? new Date(),
        updatedAt: overrides?.updatedAt ?? new Date(),
    });

    beforeEach(() => {
        repo = {
            getStudents: jest.fn(),
            getStudentByID: jest.fn(),
            createStudent: jest.fn(),
            patchStudent: jest.fn(),
            deleteStudent: jest.fn(),
            getStudentByEmail: jest.fn(),
        } as unknown as jest.Mocked<StudentRepository>;

        academicRepo = {
            getMajors: jest.fn(),
            getConcentrations: jest.fn(),
            getMinors: jest.fn(),
            getStudentMajors: jest.fn().mockResolvedValue([]),
            getStudentConcentrations: jest.fn().mockResolvedValue([]),
            getStudentMinors: jest.fn().mockResolvedValue([]),
            getMajorsForStudents: jest.fn().mockResolvedValue({}),
            getConcentrationsForStudents: jest.fn().mockResolvedValue({}),
            getMinorsForStudents: jest.fn().mockResolvedValue({}),
            addStudentMajor: jest.fn(),
            deleteStudentMajor: jest.fn(),
            addStudentConcentration: jest.fn(),
            deleteStudentConcentration: jest.fn(),
            addStudentMinor: jest.fn(),
            deleteStudentMinor: jest.fn(),
        } as unknown as jest.Mocked<AcademicRepository>;

        profilePictureRepo = {
            upload: jest.fn(),
            getPresignedUrl: jest.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
        } as jest.Mocked<ProfilePictureRepository>;

        handler = new StudentHandler(repo, academicRepo, profilePictureRepo);

        app = express();
        app.use(express.json());

        app.get("/students", handler.handleGet.bind(handler));
        app.get("/students/:id", handler.handleGetByID.bind(handler));
        app.post("/students", handler.handlePost.bind(handler));
        app.patch("/students/:id", upload.single("profilePicture"), handler.handlePatch.bind(handler));
        app.delete("/students/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);

        mockValidate.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Invalid Pagination Parameter", () => {
        test("invalid pagination query returns 400", async () => {
            const res = await request(app).get("/students?limit=abc");
            expect(res.status).toBe(400);
            expect(repo.getStudents).not.toHaveBeenCalled();
        });
    });

    describe("GET /students", () => {
        test("returns students with profilePictureUrl null when no picture", async () => {
            repo.getStudents.mockResolvedValue([makeStudent()]);

            const res = await request(app).get("/students");
            expect(res.status).toBe(200);
            expect(res.body[0]).toMatchObject({
                id: baseStudent.id,
                firstName: baseStudent.firstName,
                lastName: baseStudent.lastName,
                email: baseStudent.email,
                profilePictureUrl: null,
            });
            expect(typeof res.body[0].createdAt).toBe("string");
        });

        test("returns students with presigned profilePictureUrl when picture exists", async () => {
            const key = "profile-pictures/550e8400.jpg";
            repo.getStudents.mockResolvedValue([makeStudent({ profilePictureKey: key })]);

            const res = await request(app).get("/students");
            expect(res.status).toBe(200);
            expect(res.body[0].profilePictureUrl).toBe("https://s3.example.com/presigned-url");
            expect(profilePictureRepo.getPresignedUrl).toHaveBeenCalledWith(key);
        });

        test("repository error returns 500", async () => {
            repo.getStudents.mockRejectedValue(new Error());
            const res = await request(app).get("/students");
            expect(res.status).toBe(500);
        });
    });

    describe("GET /students/email/:email", () => {
        let emailApp: Express;
        let emailRepo: jest.Mocked<StudentRepository>;
        let emailAcademicRepo: jest.Mocked<AcademicRepository>;
        let emailProfilePictureRepo: jest.Mocked<ProfilePictureRepository>;
        let emailHandler: StudentHandler;

        const emailBaseStudent: Student = {
            id: "550e8400-e29b-41d4-a716-446655440000",
            firstName: "John",
            lastName: "Doe",
            email: "john@test.com",
            graduationYear: null,
            preferences: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        beforeEach(() => {
            emailRepo = {
                getStudents: jest.fn(),
                getStudentByID: jest.fn(),
                createStudent: jest.fn(),
                patchStudent: jest.fn(),
                deleteStudent: jest.fn(),
                getStudentByEmail: jest.fn(),
            } as unknown as jest.Mocked<StudentRepository>;

            emailAcademicRepo = {
                getMajors: jest.fn(),
                getConcentrations: jest.fn(),
                getMinors: jest.fn(),
                getStudentMajors: jest.fn().mockResolvedValue([]),
                getStudentConcentrations: jest.fn().mockResolvedValue([]),
                getStudentMinors: jest.fn().mockResolvedValue([]),
                getMajorsForStudents: jest.fn().mockResolvedValue({}),
                getConcentrationsForStudents: jest.fn().mockResolvedValue({}),
                getMinorsForStudents: jest.fn().mockResolvedValue({}),
                addStudentMajor: jest.fn(),
                deleteStudentMajor: jest.fn(),
                addStudentConcentration: jest.fn(),
                deleteStudentConcentration: jest.fn(),
                addStudentMinor: jest.fn(),
                deleteStudentMinor: jest.fn(),
            } as unknown as jest.Mocked<AcademicRepository>;

            emailProfilePictureRepo = {
                upload: jest.fn(),
                getPresignedUrl: jest.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
            } as jest.Mocked<ProfilePictureRepository>;

            emailHandler = new StudentHandler(emailRepo, emailAcademicRepo, emailProfilePictureRepo);

            emailApp = express();
            emailApp.use(express.json());
            emailApp.get("/students/email/:email", emailHandler.handleGetByEmail.bind(emailHandler));
            emailApp.use(errorHandler);

            mockValidate.mockReturnValue(true);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("returns student by email with profilePictureUrl null when no picture", async () => {
            emailRepo.getStudentByEmail.mockResolvedValue({ ...emailBaseStudent });

            const res = await request(emailApp).get("/students/email/john@test.com");

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: emailBaseStudent.id,
                firstName: emailBaseStudent.firstName,
                email: emailBaseStudent.email,
                profilePictureUrl: null,
            });
        });

        test("invalid email format returns 400", async () => {
            const res = await request(emailApp).get("/students/email/not-an-email");

            expect(res.status).toBe(400);
            expect(emailRepo.getStudentByEmail).not.toHaveBeenCalled();
        });

        test("student not found returns 404", async () => {
            emailRepo.getStudentByEmail.mockRejectedValue(new NotFoundError("Student not found"));

            const res = await request(emailApp).get("/students/email/jane@test.com");

            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Student not found");
        });

        test("repository error returns 500", async () => {
            emailRepo.getStudentByEmail.mockRejectedValue(new Error("DB failure"));

            const res = await request(emailApp).get("/students/email/john@test.com");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /students/:id", () => {
        test("returns student by id with profilePictureUrl null when no picture", async () => {
            repo.getStudentByID.mockResolvedValue(makeStudent());

            const res = await request(app).get("/students/1");

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: baseStudent.id,
                firstName: baseStudent.firstName,
                email: baseStudent.email,
                profilePictureUrl: null,
            });
        });

        test("returns student by id with presigned profilePictureUrl when picture exists", async () => {
            const key = "profile-pictures/550e8400.jpg";
            repo.getStudentByID.mockResolvedValue(makeStudent({ profilePictureKey: key }));

            const res = await request(app).get("/students/1");

            expect(res.status).toBe(200);
            expect(res.body.profilePictureUrl).toBe("https://s3.example.com/presigned-url");
            expect(profilePictureRepo.getPresignedUrl).toHaveBeenCalledWith(key);
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
                graduationYear: 2026,
                preferences: [],
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
                preferences: [],
            });
        });
    });

    describe("PATCH /students/:id", () => {
        test("updates student fields without file", async () => {
            const patch: StudentPatchInputType = { firstName: "Updated" };
            repo.patchStudent.mockResolvedValue(makeStudent({ firstName: "Updated" }));

            const res = await request(app).patch("/students/1").send(patch);

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe("Updated");
            expect(res.body.profilePictureUrl).toBeNull();
        });

        test("uploads profile picture and returns presigned URL", async () => {
            const s3Key = "profile-pictures/550e8400.jpg";
            profilePictureRepo.upload.mockResolvedValue(s3Key);
            profilePictureRepo.getPresignedUrl.mockResolvedValue("https://s3.example.com/presigned-url");
            repo.patchStudent.mockResolvedValue(makeStudent({ profilePictureKey: s3Key }));

            const res = await request(app)
                .patch(`/students/${baseStudent.id}`)
                .attach("profilePicture", Buffer.from("fake-image-data"), {
                    filename: "photo.jpg",
                    contentType: "image/jpeg",
                });

            expect(res.status).toBe(200);
            expect(profilePictureRepo.upload).toHaveBeenCalledWith(
                baseStudent.id,
                expect.any(Buffer),
                "image/jpeg",
            );
            expect(repo.patchStudent).toHaveBeenCalledWith(
                baseStudent.id,
                expect.objectContaining({ profilePictureKey: s3Key }),
            );
            expect(res.body.profilePictureUrl).toBe("https://s3.example.com/presigned-url");
        });

        test("invalid file type returns 400", async () => {
            const res = await request(app)
                .patch(`/students/${baseStudent.id}`)
                .attach("profilePicture", Buffer.from("fake-data"), {
                    filename: "doc.pdf",
                    contentType: "application/pdf",
                });

            expect(res.status).toBe(400);
            expect(profilePictureRepo.upload).not.toHaveBeenCalled();
        });

        test("S3 upload failure returns 400", async () => {
            profilePictureRepo.upload.mockRejectedValue(new Error("S3 upload failed"));

            const res = await request(app)
                .patch(`/students/${baseStudent.id}`)
                .attach("profilePicture", Buffer.from("fake-image-data"), {
                    filename: "photo.jpg",
                    contentType: "image/jpeg",
                });

            expect(res.status).toBe(400);
            expect(repo.patchStudent).not.toHaveBeenCalled();
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