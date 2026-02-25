import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Course, CoursePatchInputType, CoursePostInputType} from "../../../models/course";
import {CourseRepository} from "../../storage";
import {course} from "../../tables/course";
import { eq } from "drizzle-orm";
import {NotFoundError} from "../../../errs/httpError";
import { department } from "../../tables/department";
import { getOffset, PaginationType } from "../../../utils/pagination";

export class CourseRepositorySchema implements CourseRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getCourses(pagination: PaginationType): Promise<Course[]> {
        const rows = await this.db.select()
                                  .from(course)
                                  .innerJoin(department, eq(course.departmentId, department.id))
                                  .limit(pagination.limit)
                                  .offset(getOffset(pagination));

        return rows.map((row : typeof rows[number]) => ({
            id: row.course.id,
            name: row.course.name,
            department: {
                id: row.department.id,
                name: row.department.name
            },
            course_code: row.course.courseCode,
            description: row.course.description,
            num_credits: row.course.numCredits,
            lecture_type: row.course.lectureType,
            created_at: row.course.createdAt,
            updated_at: row.course.updatedAt
        }));
    }

    async getCourseByID(id: string): Promise<Course> {
        const [row] = await this.db.select().from(course).innerJoin(department, eq(course.departmentId, department.id)).where(eq(course.id, id));
        
        if (!row) throw new NotFoundError("Course with given ID not found");
        
        return { 
            id : row.course.id,
            name: row.course.name,
            department: {
                id: row.department.id,
                name: row.department.name
            },
            course_code: row.course.courseCode,
            description: row.course.description,
            num_credits: row.course.numCredits,
            lecture_type: row.course.lectureType,
            created_at: row.course.createdAt,
            updated_at: row.course.updatedAt
        };
    }

    async createCourse(input: CoursePostInputType): Promise<Course> {
        const [row] = await this.db.insert(course).values({
            name: input.name,
            departmentId: input.department_id,
            courseCode: input.course_code,
            description: input.description,
            numCredits: input.num_credits,
            lectureType: input.lecture_type
        }).returning();
        if (!row) throw Error();

        // Return the full course object with department details
        return this.getCourseByID(row.id);
    }

    async patchCourse(id: string, input: CoursePatchInputType): Promise<Course> {
        const [row] = await this.db.update(course).set({ ...input }).where(eq(course.id, id)).returning();
        
        const updates = Object.fromEntries(
            Object.entries(input).filter(([_, value]) => value !== undefined)
        );

        if (!row) throw new Error();

        return this.getCourseByID(row.id);
    }

    async deleteCourse(id: string): Promise<void> {
        await this.db.delete(course).where(eq(course.id, id))
    }
}