import {TraceRepository} from "../../storage";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {getOffset, PaginationType} from "../../../utils/pagination";
import {Trace, TraceFilterType} from "../../../models/trace";
import {trace} from "../../tables/trace";
import { and, eq } from "drizzle-orm"

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
}