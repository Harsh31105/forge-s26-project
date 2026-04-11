import {TraceRepository} from "../../storage";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {getOffset, PaginationType} from "../../../utils/pagination";
import {AcademicSemester, Semester, Trace, TraceFilterType} from "../../../models/trace";
import {trace} from "../../tables/trace";
import { and, desc, eq, sql } from "drizzle-orm";
import { professor } from "../../tables/professor";
import type { Professor } from "../../../models/professor";

export class TraceRepositorySchema implements TraceRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getTraces(pagination: PaginationType, filters: TraceFilterType): Promise<Trace[]> {
        const conditions = [];
        if (filters.courseId !== undefined) conditions.push(eq(trace.courseId, filters.courseId));
        if (filters.professorId !== undefined) conditions.push(eq(trace.professorId, filters.professorId));
        if (filters.departmentId !== undefined) conditions.push(eq(trace.departmentId, filters.departmentId));
        if (filters.semester !== undefined) conditions.push(eq(trace.semester, filters.semester));

        return this.db.select()
            .from(trace)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(pagination.limit)
            .offset(getOffset(pagination));
    }

    async getBestProfessorsByCourseID(courseId: string): Promise<Professor[]> {
        const rows = await this.db
            .select({
                id: professor.id,
                firstName: professor.firstName,
                lastName: professor.lastName,
                tags: professor.tags,
                createdAt: professor.createdAt,
                updatedAt: professor.updatedAt,
                avgEfficiency: sql<number>`avg(${trace.professorEfficiency})`,
            })
            .from(trace)
            .innerJoin(professor, eq(trace.professorId, professor.id))
            .where(eq(trace.courseId, courseId))
            .groupBy(
                professor.id,
                professor.firstName,
                professor.lastName,
                professor.tags,
                professor.createdAt,
                professor.updatedAt,
            )
            .orderBy(desc(sql`"avgEfficiency"`));

        return rows.map((row) => ({
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            tags: row.tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    }
    
    async getOfferHistory(pagination: PaginationType, filters: TraceFilterType): Promise<AcademicSemester[]> {
        const conditions = [];
        if (filters.courseId !== undefined) conditions.push(eq(trace.courseId, filters.courseId));
        if (filters.professorId !== undefined) conditions.push(eq(trace.professorId, filters.professorId));

        const semesterOrder = sql`
            CASE
                WHEN ${trace.semester} = 'fall' THEN 4
                WHEN ${trace.semester} = 'summer_2' THEN 3
                WHEN ${trace.semester} = 'summer_1' THEN 2
                WHEN ${trace.semester} = 'spring' THEN 1
            END
        `;

        const rows = await this.db.select().from(trace)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(
                sql`${trace.lectureYear} DESC`,
                sql`${semesterOrder} DESC`
            );

        const results: AcademicSemester[] = [];
        const seen = new Set<string>();
        for (const row of rows) {
            const key = `${row.semester}-${row.lectureYear}`;

            if (!seen.has(key)) {
                seen.add(key);
                results.push({
                   semester: row.semester,
                   year: row.lectureYear
                });
            }
        }

        return results.slice(0, pagination.limit);
    }
}
