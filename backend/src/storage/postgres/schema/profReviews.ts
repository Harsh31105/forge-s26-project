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
}
