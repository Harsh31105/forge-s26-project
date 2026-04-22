import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Course, CourseFilterType, CoursePatchInputType, CoursePostInputType } from "../../../models/course";
import {CourseRepository} from "../../storage";
import {course} from "../../tables/course";
import {NotFoundError} from "../../../errs/httpError";
import { department } from "../../tables/department";
import { getOffset, PaginationType } from "../../../utils/pagination";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export class CourseRepositorySchema implements CourseRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getCourses(pagination: PaginationType, filters: CourseFilterType): Promise<Course[]> {
        const conditions = [];
        if (filters.department_id !== undefined) conditions.push(eq(course.departmentId, filters.department_id));
        if (filters.course_code !== undefined) conditions.push(eq(course.courseCode, filters.course_code));
        if (filters.num_credits !== undefined) conditions.push(eq(course.numCredits, filters.num_credits));
        if (filters.lecture_type !== undefined) conditions.push(eq(course.lectureType, filters.lecture_type));
        if (filters.nupath !== undefined) conditions.push(eq(course.nupath, filters.nupath));

        const orderColMap = {
            course_code: course.courseCode,
            num_credits: course.numCredits,
            created_at: course.createdAt,
            name: course.name,
        };
        const orderCol = orderColMap[filters.sortBy ?? "name"] ?? course.name;
        const order = filters.sortOrder === "desc" ? desc(orderCol) : asc(orderCol);

        const rows = await this.db.select()
            .from(course)
            .innerJoin(department, eq(course.departmentId, department.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(order)
            .limit(pagination.limit)
            .offset(getOffset(pagination));

        return rows.map((row) => ({
            id: row.course.id,
            name: row.course.name,
            department: { id: row.department.id, name: row.department.name },
            course_code: row.course.courseCode,
            description: row.course.description,
            num_credits: row.course.numCredits,
            lecture_type: row.course.lectureType,
            prereqs: row.course.prereqs ?? null,
            coreqs: row.course.coreqs ?? null,
            nupath: row.course.nupath ?? null,
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
            prereqs: row.course.prereqs ?? null,
            coreqs: row.course.coreqs ?? null,
            nupath: row.course.nupath ?? null,
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
            lectureType: input.lecture_type,
            prereqs: input.prereqs,
            coreqs: input.coreqs,
            nupath: input.nupath,
        }).returning();
        if (!row) throw Error();

        // Return the full course object with department details
        return this.getCourseByID(row.id);
    }

    async patchCourse(id: string, input: CoursePatchInputType): Promise<Course> {

        const updates: Record<string, any> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.department_id !== undefined) updates.departmentId = input.department_id;
        if (input.course_code !== undefined) updates.courseCode = input.course_code;
        if (input.description !== undefined) updates.description = input.description;
        if (input.num_credits !== undefined) updates.numCredits = input.num_credits;
        if (input.lecture_type !== undefined) updates.lectureType = input.lecture_type;
        if (input.prereqs !== undefined) updates.prereqs = input.prereqs;
        if (input.coreqs !== undefined) updates.coreqs = input.coreqs;
        if (input.nupath !== undefined) updates.nupath = input.nupath;

        const [row] = await this.db.update(course).set(updates).where(eq(course.id, id)).returning();
        if (!row) throw new Error();

        return this.getCourseByID(row.id);
    }

    async deleteCourse(id: string): Promise<void> {
        await this.db.delete(course).where(eq(course.id, id))
    };
}