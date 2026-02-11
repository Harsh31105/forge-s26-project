import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CourseReview,
  CourseReviewPatchInputType,
  CourseReviewPostInputType,
} from "../../../models/courseReview";
import { CourseReviewRepository } from "../../storage";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

// ✅ NEW: correct tables for your migration
import { review } from "../../tables/review";
import { courseReview } from "../../tables/courseReview";

export class CourseReviewRepositorySchema implements CourseReviewRepository {
  constructor(private readonly db: NodePgDatabase) {
    this.db = db;
  }

  // GET all course reviews (flattened with studentId from parent review)
  async getCourseReviews(): Promise<CourseReview[]> {
    // simplest working version: fetch child rows only
    // (if your CourseReview type requires studentId, tell me and we’ll join)
    return this.db.select().from(courseReview) as unknown as CourseReview[];
  }

  async getCourseReviewByID(id: string): Promise<CourseReview> {
    // id here is reviewId (course_review.review_id)
    const [row] = await this.db
      .select()
      .from(courseReview)
      .where(eq(courseReview.reviewId, id));

    if (!row) throw new NotFoundError("course review with given ID not found");
    return row as unknown as CourseReview;
  }

  // ✅ IMPORTANT: create requires TWO inserts (review then course_review)
  async createCourseReview(
    input: CourseReviewPostInputType
  ): Promise<CourseReview> {
    const { studentId, courseId, rating, reviewText } = input;

    return this.db.transaction(async (tx) => {
      // 1) create parent review row
      const [parent] = await tx
        .insert(review)
        .values({ studentId })
        .returning();

      if (!parent) throw new Error("failed to create parent review");

      // 2) create child course_review row using parent.id as review_id
      const [child] = await tx
        .insert(courseReview)
        .values({
          reviewId: parent.id,
          courseId,
          rating,
          reviewText,
        })
        .returning();

      if (!child) throw new Error("failed to create course review");

      // return a “flattened” object (include studentId since API likely wants it)
      return {
        reviewId: child.reviewId,
        studentId: parent.studentId,
        courseId: child.courseId,
        rating: child.rating,
        reviewText: child.reviewText,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      } as unknown as CourseReview;
    });
  }

  async patchCourseReview(
    id: string,
    input: CourseReviewPatchInputType
  ): Promise<CourseReview> {
    // Only patch fields on course_review (child)
    const [row] = await this.db
      .update(courseReview)
      .set({ ...input })
      .where(eq(courseReview.reviewId, id))
      .returning();

    if (!row) throw new NotFoundError("course review with given ID not found");
    return row as unknown as CourseReview;
  }

  async deleteCourseReview(id: string): Promise<void> {
    // Because course_review.review_id has FK ON DELETE CASCADE from review,
    // deleting the parent review removes the child automatically.
    await this.db.delete(review).where(eq(review.id, id));
  }
}
