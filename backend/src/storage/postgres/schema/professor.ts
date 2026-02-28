import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Professor, ProfessorPatchInputType, ProfessorPostInputType } from "../../../models/professor";
import { ProfessorRepository } from "../../storage";
import { professor } from "../../tables/professor";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class ProfessorRepositorySchema implements ProfessorRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getProfessors(): Promise<Professor[]> {
        return this.db.select().from(professor);
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
            tags: input.tags as any,
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