import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import type { Trace, TracePatchInputType, TracePostInputType } from "../../../models/trace";
import { TraceRepository } from "../../storage";
import { trace } from "../../tables/trace";
import { type PaginationType, getOffset } from "../../../utils/pagination";
import { NotFoundError } from "../../../errs/httpError";

export class TraceRepositorySchema implements TraceRepository {
    constructor(private readonly db: NodePgDatabase) {}

    async getTraces(pagination: PaginationType): Promise<Trace[]> {
        return this.db.select().from(trace).limit(pagination.limit).offset(getOffset(pagination));
    }

    async getTraceByID(id: string): Promise<Trace> {
        const [row] = await this.db.select().from(trace).where(eq(trace.id, id));
        if (!row) throw new NotFoundError("trace with given ID not found");
        return row;
    }

    async createTrace(input: TracePostInputType): Promise<Trace> {
        const [row] = await this.db.insert(trace).values({
            id: uuid(),
            courseId: input.courseId ?? null,
            professorId: input.professorId ?? null,
            departmentId: input.departmentId ?? null,
            action: input.action,
            timestamp: input.timestamp,
        }).returning();

        if (!row) throw new Error("Failed to create trace");
        return row;
    }

    async patchTrace(id: string, input: TracePatchInputType): Promise<Trace> {
        const updates = Object.fromEntries(
            Object.entries(input).filter(([_, value]) => value !== undefined)
        );

        const [row] = await this.db
            .update(trace)
            .set({ ...updates })
            .where(eq(trace.id, id))
            .returning();

        if (!row) throw new NotFoundError("trace with given ID not found");
        return row;
    }

    async deleteTrace(id: string): Promise<void> {
        const [row] = await this.db.delete(trace).where(eq(trace.id, id)).returning();
        if (!row) throw new NotFoundError("trace with given ID not found");
    }
}