import {TraceRepository} from "../../storage";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {getOffset, PaginationType} from "../../../utils/pagination";
import {AcademicSemester, Semester, Trace, TraceFilterType} from "../../../models/trace";
import {trace} from "../../tables/trace";
import { and, eq } from "drizzle-orm"

const semesterChronology: Record<Semester, number> = {
    fall: 4,
    summer_2: 3,
    summer_1: 2,
    spring: 1
};

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

    async getOfferHistory(pagination: PaginationType, filters: TraceFilterType): Promise<AcademicSemester[]> {
        const conditions = [];
        if (filters.courseId !== undefined) conditions.push(eq(trace.courseId, filters.courseId));
        if (filters.professorId !== undefined) conditions.push(eq(trace.professorId, filters.professorId));

        const rows = await this.db.select().from(trace)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(pagination.limit)
            .offset(getOffset(pagination));

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

        results.sort((a, b) => {
            if (a.year === b.year) {
                return b.year - a.year;
            }
            return semesterChronology[b.semester] - semesterChronology[a.semester];
        });

        return results;
    }
}