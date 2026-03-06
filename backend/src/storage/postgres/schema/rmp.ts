import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { RMP, RMPPostInputType } from "../../../models/rmp";
import { RMPRepository } from "../../storage";
import { rmp } from "../../tables/rmp";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class RMPRepositorySchema implements RMPRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getRMPByProfessorID(professorId: string): Promise<RMP> {
        const [row] = await this.db.select().from(rmp).where(eq(rmp.professorId, professorId));
        if (!row) throw new NotFoundError("RMP data not found for given professor ID");
        return row;
    }

    async postRMP(input: RMPPostInputType): Promise<RMP> {
        const [row] = await this.db.insert(rmp).values({
            professorId: input.professorId,
            ratingAvg: input.ratingAvg?.toString() ?? null,
            ratingWta: input.ratingWta ?? null,
            avgDifficulty: input.avgDifficulty.toString(),
        }).returning();
        if (!row) throw Error();
        return row;
    }
}