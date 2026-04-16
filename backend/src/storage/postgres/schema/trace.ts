import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import type { Trace, TracePatchInputType, TracePostInputType } from "../../../models/trace";
import { trace } from "../../tables/trace";
import { type PaginationType, getOffset } from "../../../utils/pagination";
import { NotFoundError } from "../../../errs/httpError";

export class TraceRepositorySchema {
    constructor(private readonly db: NodePgDatabase) {}

    async getTraces(pagination: PaginationType): Promise<Trace[]> {
        return this.db.select().from(trace).limit(pagination.limit).offset(getOffset(pagination)) as Promise<Trace[]>;
    }

    async getTraceByID(id: number): Promise<Trace> {
        const [row] = await this.db.select().from(trace).where(eq(trace.id, id));
        if (!row) throw new NotFoundError("trace with given ID not found");
        return row as Trace;
    }

    async createTrace(input: TracePostInputType): Promise<Trace> {
        const [row] = await this.db.insert(trace).values({
            courseId: input.courseId,
            professorId: input.professorId,
            courseName: input.courseName,
            departmentId: input.departmentId,
            courseCode: input.courseCode,
            semester: input.semester,
            lectureYear: input.lectureYear,
            section: input.section ?? null,
            lectureType: input.lectureType ?? null,
            eval: input.eval ?? null,
            hoursDevoted: input.hoursDevoted ?? null,
            professorEfficiency: input.professorEfficiency ?? null,
            howOftenPercentage: input.howOftenPercentage ?? null,
        }).returning();

        if (!row) throw new Error("Failed to create trace");
        return row as Trace;
    }

    async patchTrace(id: number, input: TracePatchInputType): Promise<Trace> {
        const updates = Object.fromEntries(
            Object.entries(input).filter(([_, value]) => value !== undefined)
        );
        const [row] = await this.db.update(trace).set({ ...updates }).where(eq(trace.id, id)).returning();
        if (!row) throw new NotFoundError("trace with given ID not found");
        return row as Trace;
    }

    async deleteTrace(id: number): Promise<void> {
        const [row] = await this.db.delete(trace).where(eq(trace.id, id)).returning();
        if (!row) throw new NotFoundError("trace with given ID not found");
    }
}
