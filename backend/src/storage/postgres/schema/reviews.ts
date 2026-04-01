import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CourseReview,
  ProfessorReview,
  Review,
  ReviewPatchInputType,
} from "../../../models/review";
import { courseTags, professorTags } from "../../../models/review";

import { PaginationType, getOffset } from "../../../utils/pagination";

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
import { CourseReviewHelper } from "./courseReviews";
import { ProfReviewHelper } from "./profReviews";

export class ReviewRepositorySchema implements ReviewRepository {
  private readonly courseReviewHelper: CourseReviewHelper;
  private readonly profReviewHelper: ProfReviewHelper;

  constructor(private readonly db: NodePgDatabase) {
    this.courseReviewHelper = new CourseReviewHelper(db);
    this.profReviewHelper = new ProfReviewHelper(db);
  }

  async getReviews(pagination: PaginationType): Promise<Review[]> {
    const courseReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        semester: review.semester,
        year: review.year,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        reviewId: courseReview.reviewId,
        courseId: courseReview.courseId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.reviewId))
      .limit(pagination.limit)
      .offset(getOffset(pagination));

    const profReviews = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        semester: review.semester,
        year: review.year,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        reviewId: profReview.reviewId,
        professorId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.reviewId))
      .limit(pagination.limit)
      .offset(getOffset(pagination));

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
        semester: review.semester,
        year: review.year,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        courseId: courseReview.courseId,
        reviewId: courseReview.reviewId,
        rating: courseReview.rating,
        reviewText: courseReview.reviewText,
        tags: courseReview.tags,
      })
      .from(review)
      .innerJoin(courseReview, eq(review.id, courseReview.reviewId))
      .where(eq(review.id, id));

    if (courseResult) {
      const { tags, ...rest } = courseResult;
      return { ...rest, ...(tags && { tags: tags as string[] }) };
    }

    const [profResult] = await this.db
      .select({
        id: review.id,
        studentId: review.studentId,
        semester: review.semester,
        year: review.year,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        reviewId: profReview.reviewId,
        professorId: profReview.professorId,
        rating: profReview.rating,
        reviewText: profReview.reviewText,
        tags: profReview.tags,
      })
      .from(review)
      .innerJoin(profReview, eq(review.id, profReview.reviewId))
      .where(eq(review.id, id));

    if (profResult) {
      const { tags, ...rest } = profResult;
      return { ...rest, ...(tags && { tags: tags as string[] }) };
    }

    throw new NotFoundError("review with given ID not found");
  }

  async createParentReview(
    studentId?: string | null,
    semester?: string | null,
    year?: number | null,
  ): Promise<string> {
    const [row] = await this.db
      .insert(review)
      .values({
        studentId: studentId ?? null,
        ...(semester != null && { semester: semester as any }),
        ...(year != null && { year }),
      } as any)
      .returning();
    if (!row) throw new Error("Failed to create parent review");
    return row.id;
  }

  async createCourseReview(
    parentId: string,
    input: CourseReviewChildInput,
  ): Promise<CourseReview> {
    console.log("DATABASE");
    return this.courseReviewHelper.createCourseReview(
      parentId,
      input,
      this.getReviewByID.bind(this),
    );
  }

  async createProfessorReview(
    parentId: string,
    input: ProfessorReviewChildInput,
  ): Promise<ProfessorReview> {
    return this.profReviewHelper.createProfessorReview(
      parentId,
      input,
      this.getReviewByID.bind(this),
    );
  }

  async patchReview(id: string, input: ReviewPatchInputType): Promise<Review> {
    const { semester, year, ...childInput } = input;

    const parentUpdates = Object.fromEntries(
      Object.entries({ semester, year }).filter(([_, v]) => v !== undefined),
    );
    const childUpdates = Object.fromEntries(
      Object.entries(childInput).filter(([_, v]) => v !== undefined),
    );

    if (
      Object.keys(parentUpdates).length === 0 &&
      Object.keys(childUpdates).length === 0
    ) {
      return this.getReviewByID(id);
    }

    // Determine which child table owns this review
    const [isCourse] = await this.db
      .select({ reviewId: courseReview.reviewId })
      .from(courseReview)
      .where(eq(courseReview.reviewId, id))
      .limit(1);

    if (isCourse) {
      if (
        childUpdates.tags &&
        !(childUpdates.tags as string[]).every((t: string) =>
          (courseTags as readonly string[]).includes(t),
        )
      ) {
        throw new Error("invalid tags for course review");
      }
      if (Object.keys(parentUpdates).length > 0) {
        await this.db
          .update(review)
          .set(parentUpdates as any)
          .where(eq(review.id, id));
      }
      if (Object.keys(childUpdates).length > 0) {
        await this.db
          .update(courseReview)
          .set(childUpdates as any)
          .where(eq(courseReview.reviewId, id));
      }
      return this.getReviewByID(id);
    }

    const [isProf] = await this.db
      .select({ reviewId: profReview.reviewId })
      .from(profReview)
      .where(eq(profReview.reviewId, id))
      .limit(1);

    if (isProf) {
      if (
        childUpdates.tags &&
        !(childUpdates.tags as string[]).every((t: string) =>
          (professorTags as readonly string[]).includes(t),
        )
      ) {
        throw new Error("invalid tags for professor review");
      }
      if (Object.keys(parentUpdates).length > 0) {
        await this.db
          .update(review)
          .set(parentUpdates as any)
          .where(eq(review.id, id));
      }
      if (Object.keys(childUpdates).length > 0) {
        await this.db
          .update(profReview)
          .set(childUpdates as any)
          .where(eq(profReview.reviewId, id));
      }
      return this.getReviewByID(id);
    }

    throw new NotFoundError("review with given ID not found");
  }

  async deleteReview(id: string): Promise<void> {
    await this.db.delete(review).where(eq(review.id, id));
  }
}
