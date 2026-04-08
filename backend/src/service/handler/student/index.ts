import type { StudentRepository } from "../../../storage/storage";
import {
    StudentPostInputSchema,
    StudentPatchInputSchema,
    StudentPatchInputType,
    StudentPostInputType, Student
} from "../../../models/student";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { PaginationSchema } from "../../../utils/pagination";
import {isEmail} from "../../../utils/email";

export class StudentHandler {
    constructor(private readonly repo: StudentRepository) {}

    // GET/students
    async handleGet(req: Request, res: Response) :Promise<void> {

        // Pagination
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) {
            throw BadRequest("Invalid pagination parameters");
        }

        const pagination = result.data;

        let students;
        try {
            students = await this.repo.getStudents(pagination);
        } catch (err) {
            console.error("Failed to get students: ", err);
            throw mapDBError(err, "Failed to retrieve students");
        }
        res.status(200).json(students);
    }

    async handleGetByEmail(req: Request, res: Response): Promise<void> {
        const email = req.params.email as string;
        if (!isEmail(email)) throw BadRequest("failed to parse email properly");

        let student: Student;
        try {
            student = await this.repo.getStudentByEmail(email);
        } catch (err) {
            console.error(err);

            if (err instanceof NotFoundError) throw NotFound("Student not found");

            throw mapDBError(err, "Failed to retrieve student");
        }

        res.status(200).json(student);
    }

    // GET/students/{id}
    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        if (!isUUID(id)) {
            throw BadRequest("Invalid student ID")
        }

        let student;
        try {
            student = await this.repo.getStudentByID(id);
        } catch (err) {
            console.error(err);

            if (err instanceof NotFoundError)
                throw NotFound("Student not found");

            throw mapDBError(err, "Failed to retrieve student");
        }
        res.status(200).json(student);
    }

    // POST/students
    async handlePost(req: Request, res: Response): Promise<void> {
        console.log("REQ BODY:", req.body);

        const result = StudentPostInputSchema.safeParse(req.body);

        if (!result.success) {
            throw BadRequest("Unable to parse input for student POST")
        }

        const postStudent: StudentPostInputType = result.data;

        let newStudent;
        try {
            newStudent = await this.repo.createStudent(postStudent);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to create student")
        }
        res.status(201).json(newStudent);
    }

    // PATCH/students/{id}
    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        if (!isUUID(id))
            throw BadRequest("Invalid student ID was given");

        const result = StudentPatchInputSchema.safeParse(req.body);

        if (!result.success) {
            throw BadRequest("Unable to parse input for student PATCH")
        }

        const patchStudent: StudentPatchInputType = result.data;

        let updatedStudent;
        try {
            updatedStudent = await this.repo.patchStudent(id, patchStudent);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to patch student");
        }
        res.status(200).json(updatedStudent);
    }

    // DELETE/students/{id}
    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        if (!isUUID(id))
            throw BadRequest("Invalid student ID was given");

        try {
            await this.repo.deleteStudent(id);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to delete student");
        }
        res.sendStatus(204);
    }
}