import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Professor, ProfessorFilterType, ProfessorPatchInputType, ProfessorPostInputType } from "../../../models/professor";
import { ProfessorRepository } from "../../storage";
import { professor } from "../../tables/professor";
import { NotFoundError } from "../../../errs/httpError";
import { LocationTag } from "../../tables/professor";
import { and, asc, desc, eq } from "drizzle-orm";
import { getOffset, PaginationType } from "../../../utils/pagination";

export class ProfessorRepositorySchema implements ProfessorRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getProfessors(pagination: PaginationType, filters: ProfessorFilterType): Promise<Professor[]> {
        const conditions = [];
        if (filters.firstName) conditions.push(eq(professor.firstName, filters.firstName));
        if (filters.lastName) conditions.push(eq(professor.lastName, filters.lastName));

        const orderCol = filters.sortBy === "lastName" ? professor.lastName
            : filters.sortBy === "createdAt" ? professor.createdAt
            : professor.firstName;
        const order = filters.sortOrder === "desc" ? desc(orderCol) : asc(orderCol);

        return this.db.select()
        .from(professor)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(order)
        .limit(pagination.limit)
        .offset(getOffset(pagination))
        
    }

    async getProfessorByID(id: string): Promise<Professor> {
        const [row] = await this.db.select().from(professor).where(eq(professor.id, id));
        if (!row) throw new NotFoundError("professor with given ID not found");

        return row;
    }

    async createProfessor(input: ProfessorPostInputType): Promise<Professor> {
        const [row] = await this.db.insert(professor).values({
            firstName: input.firstName,
            lastName: input.lastName,
            tags: (input.tags ?? null) as LocationTag[] | null,
        }).returning();
        if (!row) throw Error();

        return row;
    }

    async patchProfessor(id: string, input: ProfessorPatchInputType): Promise<Professor> {
        const updates = Object.fromEntries(
        Object.entries(input).filter(([_, value]) => value !== undefined)
        );
        const [row] = await this.db.update(professor).set({ ...updates }).where(eq(professor.id, id)).returning();
        if (!row) throw new NotFoundError("professor with given ID not found");
        return row;
    }

    async deleteProfessor(id: string): Promise<void> {
    const [row] = await this.db.delete(professor).where(eq(professor.id, id)).returning();
    if (!row) throw new NotFoundError("professor with given ID not found");
    }
}