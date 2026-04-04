import type { CourseRepository, FavouriteRepository } from "../../../storage/storage";
import {
    Course, CourseFilterSchema, CoursePatchInputSchema, CoursePatchInputType,
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
import { getOffset, PaginationSchema, PaginationType } from "../../../utils/pagination";
import { Favourite } from "../../../models/favourite";
import type { Professor } from "../../../models/professor";

export class CourseHandler {
    constructor(private readonly courseRepo: CourseRepository,
                private readonly favRepo: FavouriteRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const paginationResult = PaginationSchema.safeParse(req.query);
        if (!paginationResult.success) {
            throw BadRequest("Invalid pagination parameters");
        }
        const pagination = paginationResult.data;

        const filterResult = CourseFilterSchema.safeParse(req.query);
        if (!filterResult.success) {
            throw BadRequest("Invalid filter parameters");
        }
        const filters = filterResult.data;

        let courses: Course[];
        try {
            courses = await this.courseRepo.getCourses(pagination, filters);
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
            course = await this.courseRepo.getCourseByID(id);
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
            newCourse = await this.courseRepo.createCourse(postCourse);
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
            updatedCourse = await this.courseRepo.patchCourse(id, patchCourse);
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
            await this.courseRepo.deleteCourse(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete course");
        }

        res.sendStatus(204);
    }

    async handleGetStudentIDsWhoFavourited(req: Request, res: Response): Promise<void> {
        const courseID = req.params.id as string;
        if (!isUUID(courseID)) throw BadRequest("Empty ID cannot be given");

        let favourites: Favourite[];
        try {
            favourites = await this.favRepo.getStudentIDsWhoFavourited(courseID);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to retrive students");
        }

        res.status(200).json(favourites)
    }

    async handleGetBestProfessors(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    if (!isUUID(id)) throw BadRequest("invalid ID was given");

    let professors: Professor[];
    try {
        professors = await this.courseRepo.getBestProfessorsByCourseID(id);
    } catch (err) {
        console.log(err);
        throw mapDBError(err, "failed to retrieve best professors for course");
    }

    res.status(200).json(professors);
}
}