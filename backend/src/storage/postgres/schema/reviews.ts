import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CourseReview,
  PaginationQueryType,
  ProfessorReview,
  Review,
  ReviewPatchInputType,
} from "../../../models/review";
import type {
  CourseReviewChildInput,
  ProfessorReviewChildInput,
  ReviewRepository,
} from "../../storage";
import { review } from "../../tables/review";
import { courseReview } from "../../tables/courseReview";
import { profReview } from "../../tables/profReview";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class ReviewRepositorySchema implements ReviewRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async getReviews(pagination: PaginationQueryType): Promise<Review[]> {
    const courseReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        courseId: courseReview.courseId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const profReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        profId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.id))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const mappedCourse: CourseReview[] = courseReviews.map(
      ({ tags, ...r }) => ({
        ...r,
        ...(tags && { tags: tags as string[] }),
      }),
    );

    const mappedProf: ProfessorReview[] = profReviews.map(({ tags, ...r }) => ({
      ...r,
      ...(tags && { tags: tags as string[] }),
    }));

    return [...mappedCourse, ...mappedProf];
  }

  async getReviewByID(id: string): Promise<Review> {
    const [courseResult] = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        courseId: courseReview.courseId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.id))
      .where(eq(review.id, id));

    if (courseResult) {
      const { tags, ...rest } = courseResult;
      return { ...rest, ...(tags && { tags: tags as string[] }) };
    }

    const [profResult] = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        profId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.id))
      .where(eq(review.id, id));

    if (profResult) {
      const { tags, ...rest } = profResult;
      return { ...rest, ...(tags && { tags: tags as string[] }) };
    }

    throw new NotFoundError("review with given ID not found");
  }

  async createParentReview(studentId?: string | null): Promise<string> {
    const [row] = await this.db
      .insert(review)
      .values({ studentId: studentId ?? null } as any)
      .returning();
    if (!row) throw new Error("Failed to create parent review");
    return row.id;
  }

  async createCourseReview(
    parentId: string,
    input: CourseReviewChildInput,
  ): Promise<CourseReview> {
    const [row] = await this.db
      .insert(courseReview)
      .values({
        id: parentId,
        courseId: input.courseId,
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .returning();

    if (!row) throw new Error("Failed to create course review");

    const result = await this.getReviewByID(parentId);
    return result as CourseReview;
  }

  async createProfessorReview(
    parentId: string,
    input: ProfessorReviewChildInput,
  ): Promise<ProfessorReview> {
    const [row] = await this.db
      .insert(profReview)
      .values({
        id: parentId,
        professorId: input.profId,
        rating: input.rating,
        reviewText: input.reviewText,
        tags: input.tags as any,
      })
      .returning();

    if (!row) throw new Error("Failed to create professor review");

    const result = await this.getReviewByID(parentId);
    return result as ProfessorReview;
  }

  async patchReview(id: string, input: ReviewPatchInputType): Promise<Review> {
    const updates: Record<string, unknown> = {};
    if (input.rating !== undefined) updates.rating = input.rating;
    if (input.reviewText !== undefined) updates.reviewText = input.reviewText;
    if (input.tags !== undefined) updates.tags = input.tags;

    if (Object.keys(updates).length === 0) return this.getReviewByID(id);

    // Try course review first
    const [updatedCourse] = await this.db
      .update(courseReview)
      .set(updates as any)
      .where(eq(courseReview.id, id))
      .returning();

    if (updatedCourse) return this.getReviewByID(id);

    // Try professor review
    const [updatedProf] = await this.db
      .update(profReview)
      .set(updates as any)
      .where(eq(profReview.id, id))
      .returning();

    if (updatedProf) return this.getReviewByID(id);

    throw new Error("review with given ID not found");
  }

  async deleteReview(id: string): Promise<void> {
    await this.db.delete(review).where(eq(review.id, id));
  }
}
