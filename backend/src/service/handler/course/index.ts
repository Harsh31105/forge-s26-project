import type { CourseRepository } from "../../../storage/storage";
import {
    Course, CoursePatchInputSchema, CoursePatchInputType,
    CoursePostInputSchema,
    CoursePostInputType
} from "../../../models/course";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { getOffset, PaginationSchema } from "../../../utils/pagination";

export class CourseHandler {
    constructor(private readonly repo: CourseRepository) {}

    async handleGet(req: Request, res: Response) :Promise<void> {
        const result = PaginationSchema.safeParse(req.query);
        if (!result.success) {
            throw BadRequest("Invalid pagination parameters");
        }
        const pagination = result.data;

        let courses: Course[];

        try {
            courses = await this.repo.getCourses(pagination);
        } catch (err) {
            console.log("Failed to get courses: ", err);
            throw mapDBError(err, "failed to retrieve courses");
        }

        res.status(200).json(courses);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        let course: Course;
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Empty ID cannot be given")

        try {
            course = await this.repo.getCourseByID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("course not found");

            throw mapDBError(err, "failed to retrieve course");
        }

        res.status(200).json(course);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const result = CoursePostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for post-course")
        }
        const postCourse: CoursePostInputType = result.data;

        let newCourse: Course;
        try {
            newCourse = await this.repo.createCourse(postCourse);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post course");
        }

        res.status(201).json(newCourse);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        const result = CoursePatchInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for patch-course")
        }
        const patchCourse: CoursePatchInputType = result.data;

        let updatedCourse: Course;
        try {
            updatedCourse = await this.repo.patchCourse(id, patchCourse);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to patch course");
        }

        res.status(200).json(updatedCourse);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteCourse(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete course");
        }

        res.sendStatus(204);
    }
}