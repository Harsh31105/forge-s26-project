import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Professor, ProfessorFilterType, ProfessorPatchInputType, ProfessorPostInputType } from "../../../models/professor";
import { ProfessorRepository } from "../../storage";
import type { ProfessorAvatarRepository } from "../../s3/professorAvatars";
import { professor } from "../../tables/professor";
import { rmp } from "../../tables/rmp";
import { NotFoundError } from "../../../errs/httpError";
import { LocationTag } from "../../tables/professor";
import { and, asc, desc, eq } from "drizzle-orm";
import { getOffset, PaginationType } from "../../../utils/pagination";
import type { RMP } from "../../../models/rmp";

export class ProfessorRepositorySchema implements ProfessorRepository {
    constructor(
        private readonly db: NodePgDatabase,
        private readonly avatarRepo: ProfessorAvatarRepository,
    ) {}

    async getProfessors(pagination: PaginationType, filters: ProfessorFilterType): Promise<Professor[]> {
            const conditions = [];
        if (filters.firstName !== undefined) conditions.push(eq(professor.firstName, filters.firstName));
        if (filters.lastName !== undefined) conditions.push(eq(professor.lastName, filters.lastName));

        const orderColMap = {
            firstName: professor.firstName,
            lastName: professor.lastName,
            createdAt: professor.createdAt,
        };
        const orderCol = orderColMap[filters.sortBy ?? "firstName"] ?? professor.firstName;
        const order = filters.sortOrder === "desc" ? desc(orderCol) : asc(orderCol);

        return this.db.select()
            .from(professor)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(order)
            .limit(pagination.limit)
            .offset(getOffset(pagination));
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
            avatar: this.avatarRepo.getRandomAvatarKey(),
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
    
    async getRMPByProfessorID(professorId: string): Promise<RMP> {
        const [row] = await this.db.select().from(rmp).where(eq(rmp.professorId, professorId));
        if (!row) throw new NotFoundError("RMP data not found for given professor ID");
        return row;
    }

}