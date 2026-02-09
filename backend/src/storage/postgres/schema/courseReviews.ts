import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CourseReview,
  CourseReviewPatchInputType,
  CourseReviewPostInputType,
} from "../../../models/courseReview";
import { CourseReviewRepository } from "../../storage";
import { courseReviews } from "../../tables/courseReviews";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";

export class CourseReviewRepositorySchema implements CourseReviewRepository {
  constructor(private readonly db: NodePgDatabase) {
    this.db = db;
  }

  async getCourseReviews(): Promise<CourseReview[]> {
    return this.db.select().from(courseReviews);
  }

  async getCourseReviewByID(id: string): Promise<CourseReview> {
    const [row] = await this.db
      .select()
      .from(courseReviews)
      .where(eq(courseReviews.id, id));

    if (!row) throw new NotFoundError("course review with given ID not found");
    return row;
  }

  async createCourseReview(input: CourseReviewPostInputType): Promise<CourseReview> {
    const [row] = await this.db
      .insert(courseReviews)
      .values({
        courseId: input.courseId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .returning();

    if (!row) throw Error();
    return row;
  }

  async patchCourseReview(id: string, input: CourseReviewPatchInputType): Promise<CourseReview> {
    const [row] = await this.db
      .update(courseReviews)
      .set({ ...input })
      .where(eq(courseReviews.id, id))
      .returning();

    if (!row) throw new Error();
    return row;
  }

  async deleteCourseReview(id: string): Promise<void> {
    await this.db.delete(courseReviews).where(eq(courseReviews.id, id));
  }
}
