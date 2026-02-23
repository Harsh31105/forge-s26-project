import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../../errs/httpError";
import type {
  CourseThread,
  CourseThreadPatchInputType,
  CourseThreadPostInputType,
} from "../../../models/courseThread";
import type { CourseThreadRepository } from "../../storage";
import { courseThread } from "../../tables/courseThread";
import { type PaginationType, getOffset } from "../../../utils/pagination";

export class CourseThreadRepositorySchema implements CourseThreadRepository {
  constructor(private readonly db: NodePgDatabase) {
    this.db = db;
  }

  async getThreadsByCourseReviewId(courseReviewId: string, pagination: PaginationType): Promise<CourseThread[]> {
    return this.db
      .select()
      .from(courseThread)
      .where(eq(courseThread.courseReviewId, courseReviewId))
      .limit(pagination.limit)
      .offset(getOffset(pagination));
  }

  async createThread(courseReviewId: string, input: CourseThreadPostInputType): Promise<CourseThread> {
    const [row] = await this.db
      .insert(courseThread)
      .values({
        courseReviewId,
        studentId: input.studentId,
        content: input.content,
      })
      .returning();

    if (!row) throw new Error();
    return row;
  }

  async patchThread(threadId: string, input: CourseThreadPatchInputType): Promise<CourseThread> {
    const [row] = await this.db
      .update(courseThread)
      .set({ ...input })
      .where(eq(courseThread.id, threadId))
      .returning();

    if (!row) throw new NotFoundError("thread with given ID not found");
    return row;
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.db.delete(courseThread).where(eq(courseThread.id, threadId));
  }
}
