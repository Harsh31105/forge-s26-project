import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { RMP, RMPPostInputType } from "../../../models/rmp";
import { RMPRepository } from "../../storage";
import { rmp } from "../../tables/rmp";
import { NotFoundError } from "../../../errs/httpError";
import { eq, sql } from "drizzle-orm";


export class RMPRepositorySchema implements RMPRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getRMPByProfessorID(professorId: string): Promise<RMP | null> {
        const [row] = await this.db.select().from(rmp).where(eq(rmp.professorId, professorId));
        if (!row) return null;
        return row;
    }

    async postRMP(input: RMPPostInputType[]): Promise<RMP[]> {
        if (input.length === 0) return [];
        
        const rows = await this.db.insert(rmp).values(
            input.map(d => ({
                professorId: d.professorId,
                ratingAvg: d.ratingAvg?.toString() ?? null,
                ratingWta: d.ratingWta != null ? Math.round(d.ratingWta) : null,
                avgDifficulty: d.avgDifficulty!.toString(),
            }))
        ).onConflictDoUpdate({
            target: rmp.professorId,
            set: {
                ratingAvg: sql`EXCLUDED.rating_avg`,
                ratingWta: sql`EXCLUDED.rating_wta`,
                avgDifficulty: sql`EXCLUDED.avg_difficulty`,
            }
        }).returning();

        return rows;
    }
}