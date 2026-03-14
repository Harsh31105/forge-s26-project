import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Trace, TracePostInputType, TracePatchInputType } from "../../../models/trace";
import { trace } from "../../tables/trace";
import { and, eq, sql } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";
import { PaginationType, getOffset } from "../../../utils/pagination";

export class TraceRepositorySchema {
    constructor(private readonly db: NodePgDatabase) {}

    async getTraces(
        filters: { course_id?: string; professor_id?: string; department_id?: string },
        pagination: PaginationType
    ): Promise<Trace[]> {
        const conditions = [];

        if (filters.course_id) conditions.push(eq(trace.courseID, filters.course_id));
        if (filters.professor_id) conditions.push(eq(trace.professorID, filters.professor_id));
        if (filters.department_id) conditions.push(eq(trace.departmentID, filters.department_id));

        const rows = this.db
            .select()
            .from(trace)
            .where(conditions.length ? and(...conditions) : undefined)
            .limit(pagination.limit)
            .offset(getOffset(pagination));

        return rows;
    }
}