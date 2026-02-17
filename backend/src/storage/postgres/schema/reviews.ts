import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Review, ReviewPatchInputType, ReviewPostInputType } from "../../../models/review";
import { ReviewRepository } from "../../storage";
import { review } from "../../tables/review";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class ReviewRepositorySchema implements ReviewRepository {
    constructor(private readonly db: NodePgDatabase) {}

    async getReviews(): Promise<Review[]> {
        return this.db.select().from(review);
    }

    async getReviewByID(id: string): Promise<Review> {
        const [row] = await this.db.select().from(review).where(eq(review.id, id));
        if (!row) throw new NotFoundError("review with given ID not found");
        return row;
    }

    async createReview(input: ReviewPostInputType): Promise<Review> {
        const [row] = await this.db.insert(review).values({
            rating: input.rating,
            content: input.content,
            courseId: input.courseId ?? null,
            profId: input.profId ?? null,
        }).returning();
        if (!row) throw new Error();
        return row;
    }

    async patchReview(id: string, input: ReviewPatchInputType): Promise<Review> {
        const [row] = await this.db
            .update(review)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(review.id, id))
            .returning();
        if (!row) throw new NotFoundError("review with given ID not found");
        return row;
    }

    async deleteReview(id: string): Promise<void> {
        await this.db.delete(review).where(eq(review.id, id));
    }
}
