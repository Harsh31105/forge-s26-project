import request from "supertest";
import express, { Express } from "express";
import { CourseHandler } from "../course";
import type { CourseRepository } from "../../../storage/storage";
import { CoursePostInputType, CoursePatchInputType, Course } from "../../../models/course";
import { validate as isUUID } from "uuid";
import {errorHandler, NotFoundError} from "../../../errs/httpError";

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));
const mockValidate = isUUID as jest.Mock;

const mockCourse1: Course = {
    id: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
    name: "Object Oriented Design",
    department: {
        id: 1,
        name: "CS"
    },
    course_code: 3500,
    description: "Learn how to design software using object-oriented principles.",
    num_credits: 4,
    lecture_type: "lecture",
    created_at: new Date("2026-01-15T10:30:00Z"),
    updated_at: new Date("2026-01-15T10:30:00Z")
};

const mockCourse2: Course = {
    id: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
    name: "Foundations of Data Science",
    department: {
        id: 2,
        name: "DS"
    },
    course_code: 3000,
    description: "Introduction to mathematical concepts for the BIG 4.",
    num_credits: 4,
    lecture_type: "online",
    created_at: new Date("2026-01-18T10:30:00Z"),
    updated_at: new Date("2026-01-18T10:30:00Z")
};

const mockCourse3: Course = {
    id: "e4da3b7f-bbce-4a9b-9f0e-1c2f3a4b5c6d",
    name: "Algorithms & Data Structures Lab",
    department: {
        id: 1,
        name: "CS"
    },
    course_code: 3001,
    description: "Learn fundamental algorithms and data structures in lab.",
    num_credits:  1,
    lecture_type: "lab",
    created_at: new Date("2026-01-19T10:30:00Z"),
    updated_at: new Date("2026-01-19T10:30:00Z")
};


describe("CourseHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<CourseRepository>;
    let handler: CourseHandler;

    beforeEach(() => {
        repo = {
            getCourses: jest.fn(),
            getCourseByID: jest.fn(),
            createCourse: jest.fn(),
            patchCourse: jest.fn(),
            deleteCourse: jest.fn(),
        } as unknown as jest.Mocked<CourseRepository>;

        handler = new CourseHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/courses", handler.handleGet.bind(handler));
        app.get("/courses/:id", handler.handleGetByID.bind(handler));
        app.post("/courses", handler.handlePost.bind(handler));
        app.patch("/courses/:id", handler.handlePatch.bind(handler));
        app.delete("/courses/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /courses", () => {
        test("returns all courses", async () => {
            repo.getCourses.mockResolvedValue([mockCourse1, mockCourse2, mockCourse3]);

            const res = await request(app).get("/courses");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            expect(res.body[0]).toMatchObject({
                id: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
                name: "Object Oriented Design",
                department: { id: 1, name: "CS" },
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture",
                created_at: "2026-01-15T10:30:00.000Z",
                updated_at: "2026-01-15T10:30:00.000Z"
            });

            expect(res.body[1]).toMatchObject({
                id: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
                name: "Foundations of Data Science",
                department: { id: 2, name: "DS" },
                course_code: 3000,
                description: "Introduction to mathematical concepts for the BIG 4.",
                num_credits: 4,
                lecture_type: "online",
                created_at: "2026-01-18T10:30:00.000Z",
                updated_at: "2026-01-18T10:30:00.000Z"
            });

            expect(res.body[2]).toMatchObject({
                id: "e4da3b7f-bbce-4a9b-9f0e-1c2f3a4b5c6d",
                name: "Algorithms & Data Structures Lab",
                department: { id: 1, name: "CS" },
                course_code: 3001,
                description: "Learn fundamental algorithms and data structures in lab.",
                num_credits: 1,
                lecture_type: "lab",
                created_at: "2026-01-19T10:30:00.000Z",
                updated_at: "2026-01-19T10:30:00.000Z"
            });
        });

        test("returns empty array when no courses", async () => {
            repo.getCourses.mockResolvedValue([]);
            const res = await request(app).get("/courses");
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        test("repository throws error", async () => {
            repo.getCourses.mockRejectedValue(new Error("DB error"));
            const res = await request(app).get("/courses");
            expect(res.status).toBe(500);
        });
    });

    describe("GET /courses/:id", () => {
        test("returns course by ID", async () => {
            repo.getCourseByID.mockResolvedValue(mockCourse1);
            mockValidate.mockReturnValue(true);

            const res = await request(app).get(`/courses/${mockCourse1.id}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
                name: "Object Oriented Design",
                department: { id: 1, name: "CS" },
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture",
                created_at: "2026-01-15T10:30:00.000Z",
                updated_at: "2026-01-15T10:30:00.000Z"
            });
        });

        test("return course from different department", async () => {
            repo.getCourseByID.mockResolvedValue(mockCourse2);
            mockValidate.mockReturnValue(true);
            const res = await request(app).get(`/courses/${mockCourse2.id}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
                name: "Foundations of Data Science",
                department: { id: 2, name: "DS" },
                course_code: 3000,
                description: "Introduction to mathematical concepts for the BIG 4.",
                num_credits: 4,
                lecture_type: "online",
                created_at: "2026-01-18T10:30:00.000Z",
                updated_at: "2026-01-18T10:30:00.000Z"
            });
        });

        test("Invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).get("/courses/invalid-uuid");
            expect(res.status).toBe(400);
        });

        test("internal error", async () => {
            repo.getCourseByID.mockRejectedValue(new Error("DB error"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).get(`/courses/${mockCourse1.id}`);
            expect(res.status).toBe(500);
        });

        test("course not found", async () => {
            repo.getCourseByID.mockRejectedValue(new NotFoundError("Course with given ID not found"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).get(`/courses/${mockCourse1.id}`);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /course", () => {
        test("creates course", async () => {
            const payload: CoursePostInputType = { 
                name: "Object Oriented Design",
                department_id: 1,
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture"
            };
            repo.createCourse.mockResolvedValue(mockCourse1);

            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                name: "Object Oriented Design",
                department: { id: 1, name: "CS" },
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture"
            });
        });

        test("creates course without lecture_type", async () => {
            const payload: CoursePostInputType = { 
                name: "Foundations of Data Science",
                department_id: 1,
                course_code: 3000,
                description: "Introduction to mathematical concepts for the BIG 4.",
                num_credits: 4
            };
            repo.createCourse.mockResolvedValue(mockCourse2);

            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                name: "Foundations of Data Science",
                department: { id: 2, name: "DS" },
                course_code: 3000,
                description: "Introduction to mathematical concepts for the BIG 4.",
                num_credits: 4      
            });
        });

        test("missing required fields", async () => {
            const payload = { name: "Incomplete Course" };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("course_code below minimum", async () => {
            const payload = { 
                name: "Invalid Course Code",
                department_id: 1,
                course_code: 0,
                description: "Course code must be between 1000 and 10000.",
                num_credits: 4
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });
        
        test("course_code above maximum", async () => {
            const payload = { 
                name: "Invalid Course Code",
                department_id: 1,
                course_code: 10001,
                description: "Course code must be between 1000 and 10000.",
                num_credits: 4
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("num_credits below minimum", async () => {
            const payload = { 
                name: "Invalid Course Credits",
                department_id: 1,
                course_code: 3000,
                description: "Credits must be between 1 and 6.",
                num_credits: 0,
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("num_credits above maximum", async () => {
            const payload = { 
                name: "Invalid Course Credits",
                department_id: 1,
                course_code: 3000,
                description: "Credits must be between 1 and 6.",
                num_credits: 7,
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("name with leading/trailing whitespace", async () => {
            const payload = { 
                name: " Invalid Name ",
                department_id: 1,
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture"
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("invalid lecture_type", async () => {
            const payload = { 
                name: "Invalid Lecture Type",
                department_id: 1,
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "seminar"
            };
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(400);
        });

        test("repository throws error", async () => {
            const payload: CoursePostInputType = { 
                name: "Object Oriented Design",
                department_id: 1,
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture"
            };
            repo.createCourse.mockRejectedValue(new Error("DB error"));
            const res = await request(app).post("/courses").send(payload);
            expect(res.status).toBe(500);
        });

    });

    describe("PATCH /courses/:id", () => {
        test("updates course name", async () => {
            const patch: CoursePatchInputType = { name: "Functional Programming Design" };
            const updated: Course = { ...mockCourse1, name: "Functional Programming Design" };
            repo.patchCourse.mockResolvedValue(updated);
            mockValidate.mockReturnValue(true);

            const res = await request(app).patch(`/courses/${mockCourse1.id}`).send(patch);
            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Functional Programming Design");
        });

        test("updates multiple fields", async () => {
            const patch: CoursePatchInputType = {
                name: "Functional Programming Design",
                course_code: 3100,
                description: "Learn functional programming concepts.",
                num_credits: 5,
                lecture_type: "online"
            };
            const updated: Course = { 
                ...mockCourse1, 
                name: "Functional Programming Design", 
                course_code: 3100, 
                description: "Learn functional programming concepts.",
                num_credits: 5,
                lecture_type: "online"
            };
            repo.patchCourse.mockResolvedValue(updated);
            mockValidate.mockReturnValue(true);

            const res = await request(app).patch(`/courses/${mockCourse1.id}`).send(patch);
            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Functional Programming Design");
            expect(res.body.course_code).toBe(3100);
            expect(res.body.description).toBe("Learn functional programming concepts.");
            expect(res.body.num_credits).toBe(5);
            expect(res.body.lecture_type).toBe("online");
        });

        test("patch with no fields", async () => {
            const patch: CoursePatchInputType = {};
            const updated: Course = { ...mockCourse1 };
            repo.patchCourse.mockResolvedValue(updated);
            mockValidate.mockReturnValue(true);
            const res = await request(app).patch(`/courses/${mockCourse1.id}`).send(patch);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                name: "Object Oriented Design",
                department: { id: 1, name: "CS" },
                course_code: 3500,
                description: "Learn how to design software using object-oriented principles.",
                num_credits: 4,
                lecture_type: "lecture",
            });
        });

        test("course not found", async () => {
            const patch: CoursePatchInputType = { name: "Updated" };
            repo.patchCourse.mockRejectedValue(new NotFoundError("Course with given ID not found"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).patch(`/courses/${mockCourse1.id}`).send(patch);
            expect(res.status).toBe(404);
        });

        test("invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const patch: CoursePatchInputType = { name: "Updated" };
            const res = await request(app).patch("/courses/invalid-uuid").send(patch);
            expect(res.status).toBe(400);
        });

        test("repository throws error", async () => {
            const patch: CoursePatchInputType = { name: "Updated" };
            repo.patchCourse.mockRejectedValue(new Error("DB error"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).patch(`/courses/${mockCourse1.id}`).send(patch);
            expect(res.status).toBe(500);
        });
    });

    describe("DELETE /courses/:id", () => {
        test("deletes course", async () => {
            repo.deleteCourse.mockResolvedValue(undefined);
            mockValidate.mockReturnValue(true);

            const res = await request(app).delete(`/courses/${mockCourse3.id}`);
            expect(res.status).toBe(204);
        });

        test("course not found", async () => {
            repo.deleteCourse.mockRejectedValue(new NotFoundError("Course with given ID not found"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).delete(`/courses/${mockCourse1.id}`);
            expect(res.status).toBe(404);
        });

        test("invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).delete("/courses/invalid-uuid");
            expect(res.status).toBe(400);
        });

        test("repository throws error", async () => {
            repo.deleteCourse.mockRejectedValue(new Error("DB error"));
            mockValidate.mockReturnValue(true);
            const res = await request(app).delete(`/courses/${mockCourse1.id}`);
            expect(res.status).toBe(500);
        });
    }); 
});
