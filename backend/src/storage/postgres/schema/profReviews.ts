import { eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ProfessorReview, Review } from "../../../models/review";
import { ProfessorReviewChildInput } from "../../storage";
import { profReview } from "../../tables/profReview";

export class ProfReviewHelper {
  constructor(private readonly db: NodePgDatabase) {}

  async createProfessorReview(
    parentId: string,
    input: ProfessorReviewChildInput,
    getReviewByID: (id: string) => Promise<Review>,
  ): Promise<ProfessorReview> {
    const [row] = await this.db
      .insert(profReview)
      .values({
        reviewId: parentId,
        professorId: input.professorId,
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .returning();

    if (!row) throw new Error("Failed to create professor review");

    return (await getReviewByID(parentId)) as ProfessorReview;
  }

  async getTopTagsByProfessorId(professorId: string): Promise<{ tag: string; count: number }[]> {
    const rows = await this.db
      .select({ tags: profReview.tags })
      .from(profReview)
      .where(eq(profReview.professorId, professorId));

    const tagCount: Record<string, number> = {};
    for (const row of rows) {
      if (row.tags) {
        for (const tag of row.tags) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      }
    }

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  async getRatingsByProfessorId(professorId: string): Promise<{ averageRating: number | null; totalRatings: number }> {
    const rows = await this.db
      .select({ rating: profReview.rating })
      .from(profReview)
      .where(eq(profReview.professorId, professorId));

    if (rows.length === 0) return { averageRating: null, totalRatings: 0 };

    const total = rows.reduce((sum, r) => sum + r.rating, 0);
    return {
      averageRating: total / rows.length,
      totalRatings: rows.length,
    };
  }
}
