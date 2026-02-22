import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CourseReview,
  ProfessorReview,
  Review,
  ReviewPatchInputType,
  ReviewPostInputType,
} from "../../../models/review";
import { ReviewRepository } from "../../storage";
import { review, courseReview, profReview } from "../../tables/review";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class ReviewRepositorySchema implements ReviewRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async getReviews(): Promise<Review[]> {
    const courseReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        courseId: courseReview.courseId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
        createdAt: courseReview.createdAt,
        updatedAt: courseReview.updatedAt,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.id));

    const profReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        profId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
        createdAt: profReview.createdAt,
        updatedAt: profReview.updatedAt,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.id));

    const mappedProfReviews: ProfessorReview[] = profReviews.map(
      ({ tags, ...r }) => ({
        ...r,
        type: "professor" as const,
        ...(tags && { tags: tags as string[] }),
      }),
    );

    const mappedCourseReviews: CourseReview[] = courseReviews.map(
      ({ tags, ...r }) => ({
        ...r,
        type: "course" as const,
        ...(tags && { tags: tags as string[] }),
      }),
    );

    return [...mappedCourseReviews, ...mappedProfReviews];
  }

  async getReviewByID(id: string): Promise<Review> {
    // Try course review first
    const [courseResult] = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        courseId: courseReview.courseId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
        createdAt: courseReview.createdAt,
        updatedAt: courseReview.updatedAt,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.id))
      .where(eq(review.id, id));

    if (courseResult) {
      const { tags, ...rest } = courseResult;
      return {
        ...rest,
        type: "course" as const,
        ...(tags && { tags: tags as string[] }),
      };
    }

    // Try professor review
    const [profResult] = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        profId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
        createdAt: profReview.createdAt,
        updatedAt: profReview.updatedAt,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.id))
      .where(eq(review.id, id));

    if (profResult) {
      const { tags, ...rest } = profResult;
      return {
        ...rest,
        type: "professor" as const,
        ...(tags && { tags: tags as string[] }),
      };
    }

    throw new NotFoundError("review with given ID not found");
  }

  async createReview(input: ReviewPostInputType): Promise<Review> {
    // First insert into parent review table
    const [parentRow] = await this.db
      .insert(review)
      .values({
        // studentId can be added here if available from context
      })
      .returning();

    if (!parentRow) throw new Error("Failed to create review");

    // Then insert into appropriate child table
    if (input.courseId) {
      const [courseRow] = await this.db
        .insert(courseReview)
        .values({
          id: parentRow.id,
          courseId: input.courseId,
          rating: input.rating,
          reviewText: input.reviewText,
          tags: input.tags as any,
        })
        .returning();

      if (!courseRow) throw new Error("Failed to create course review");

      return {
        ...parentRow,
        courseId: courseRow.courseId,
        rating: courseRow.rating,
        reviewText: courseRow.reviewText,
        createdAt: courseRow.createdAt,
        updatedAt: courseRow.updatedAt,
        type: 'course' as const,
        ...(courseRow.tags && { tags: courseRow.tags as string[] }),
      };
    } else if (input.profId) {
      const [profRow] = await this.db
        .insert(profReview)
        .values({
          id: parentRow.id,
          professorId: input.profId,
          rating: input.rating,
          reviewText: input.reviewText,
          tags: input.tags as any,
        })
        .returning();

      if (!profRow) throw new Error("Failed to create professor review");

      return {
        ...parentRow,
        profId: profRow.professorId,
        rating: profRow.rating,
        reviewText: profRow.reviewText,
        createdAt: profRow.createdAt,
        updatedAt: profRow.updatedAt,
        type: 'professor' as const,
        ...(profRow.tags && { tags: profRow.tags as string[] }),
      };
    }

    throw new Error("Invalid review input");
  }

  async patchReview(id: string, input: ReviewPatchInputType): Promise<Review> {
    // Update parent table timestamp
    await this.db
      .update(review)
      .set({ updatedAt: new Date() })
      .where(eq(review.id, id));

    // Try updating course review
    const [updatedCourse] = await this.db
      .update(courseReview)
      .set({
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .where(eq(courseReview.id, id))
      .returning();

    if (updatedCourse) {
      // Fetch complete review with parent data
      return this.getReviewByID(id);
    }

    // Try updating professor review
    const [updatedProf] = await this.db
      .update(profReview)
      .set({
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .where(eq(profReview.id, id))
      .returning();

    if (updatedProf) {
      return this.getReviewByID(id);
    }

    throw new NotFoundError("review with given ID not found");
  }
  async deleteReview(id: string): Promise<void> {
    await this.db.delete(review).where(eq(review.id, id));
  }
}
