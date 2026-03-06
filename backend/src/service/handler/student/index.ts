import type { StudentRepository } from "../../../storage/storage";
import {
    StudentPostInputSchema,
    StudentPostInputType,
    StudentPatchInputSchema,
    StudentPatchInputType,
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

        try {
            const students = await this.repo.getStudents(pagination);
            res.status(200).json(students);
        } catch (err) {
            console.error("Failed to get students: ", err);
            throw mapDBError(err, "Failed to retrieve students");
        }
    }

    // GET/students/{id}
    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        if (!isUUID(id))
            throw BadRequest("Invalid student ID")

        try {
            const student = await this.repo.getStudentByID(id);
            res.status(200).json(student);
        } catch (err) {
            console.error(err);

            if (err instanceof NotFoundError)
                throw NotFound("Student not found");

            throw mapDBError(err, "Failed to retrieve student");
        }
    }

    // POST/students
    async handlePost(req: Request, res: Response): Promise<void> {
        const result = StudentPostInputSchema.safeParse(req.body);

        if (!result.success) {
            throw BadRequest("Unable to parse input for student POST")
        }

        const postStudent: StudentPostInputType = result.data;

        try {
            const newStudent = await this.repo.createStudent(postStudent);
            res.status(201).json(newStudent);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to create student")
        }
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

        try {
            const updatedStudent = await this.repo.patchStudent(id, patchStudent);
            res.status(200).json(updatedStudent);
        } catch (err) {
            console.error(err);

            if (err instanceof NotFoundError)
                throw NotFound("Student not found");

            throw mapDBError(err, "Failed to patch student");
        }
    }

    // DELETE/students/{id}
    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;

        if (!isUUID(id))
            throw BadRequest("Invalid student ID was given");

        try {
            await this.repo.deleteStudent(id);
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            throw mapDBError(err, "Failed to delete student");
        }
    }
}