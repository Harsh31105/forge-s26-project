import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CourseReview, Review } from "../../../models/review";
import type { CourseReviewChildInput } from "../../storage";
import { courseReview } from "../../tables/courseReview";

export class CourseReviewHelper {
  constructor(private readonly db: NodePgDatabase) {}

  async createCourseReview(
    parentId: string,
    input: CourseReviewChildInput,
    getReviewByID: (id: string) => Promise<Review>,
  ): Promise<CourseReview> {
    const [row] = await this.db
      .insert(courseReview)
      .values({
        reviewId: parentId,
        courseId: input.courseId,
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .returning();

    if (!row) throw new Error("Failed to create course review");

    return getReviewByID(parentId) as Promise<CourseReview>;
  }
}
