/**
 * DB tests for CourseThreadRepositorySchema.
 * Require Docker (testcontainers) to be running. Run with: npm test -- src/storage/postgres/schema/tests/courseThreads.test.ts
 */
import {
  setupTestWithCleanup,
  shutdownSharedTestDB,
} from "../../testutil/shared_db";
import { CourseThreadRepositorySchema } from "../courseThreads";
import { NotFoundError } from "../../../../errs/httpError";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { newPagination } from "../../../../utils/pagination";

describe("CourseThreadRepositorySchema (DB)", () => {
  let db: NodePgDatabase;
  let repo: CourseThreadRepositorySchema;

  const courseReviewId = "11111111-1111-1111-1111-111111111111";
  const studentId = "22222222-2222-2222-2222-222222222222";

  beforeAll(async () => {
    db = await setupTestWithCleanup();
    repo = new CourseThreadRepositorySchema(db);
  }, 60_000);

  afterAll(async () => {
    await shutdownSharedTestDB();
  });

  beforeEach(async () => {
    await setupTestWithCleanup();
  });

  describe("getThreadsByCourseReviewId", () => {
    it("returns empty array when no threads", async () => {
      const threads = await repo.getThreadsByCourseReviewId(courseReviewId, newPagination());
      expect(threads).toEqual([]);
    });

    it("returns threads for the given course review id", async () => {
      const created = await repo.createThread(courseReviewId, {
        studentId,
        content: "First thread",
      });
      const threads = await repo.getThreadsByCourseReviewId(courseReviewId, newPagination());
      expect(threads).toHaveLength(1);
      const first = threads[0];
      expect(first).toBeDefined();
      expect(first!.id).toBe(created.id);
      expect(first!.content).toBe("First thread");
      expect(first!.courseReviewId).toBe(courseReviewId);
      expect(first!.studentId).toBe(studentId);
    });
  });

  describe("createThread", () => {
    it("inserts and returns thread with id and timestamps", async () => {
      const created = await repo.createThread(courseReviewId, {
        studentId,
        content: "New thread content",
      });
      expect(created.id).toBeDefined();
      expect(created.courseReviewId).toBe(courseReviewId);
      expect(created.studentId).toBe(studentId);
      expect(created.content).toBe("New thread content");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("patchThread", () => {
    it("updates content and returns updated thread", async () => {
      const created = await repo.createThread(courseReviewId, {
        studentId,
        content: "Original",
      });
      const updated = await repo.patchThread(created.id, {
        content: "Updated content",
      });
      expect(updated.id).toBe(created.id);
      expect(updated.content).toBe("Updated content");
    });

    it("throws NotFoundError when thread does not exist", async () => {
      const badId = "00000000-0000-0000-0000-000000000000";
      await expect(repo.patchThread(badId, { content: "x" })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("deleteThread", () => {
    it("deletes thread by id", async () => {
      const created = await repo.createThread(courseReviewId, {
        studentId,
        content: "To delete",
      });
      await repo.deleteThread(created.id);
      const threads = await repo.getThreadsByCourseReviewId(courseReviewId, newPagination());
      expect(threads).toHaveLength(0);
    });

    it("does not throw when thread does not exist", async () => {
      const badId = "00000000-0000-0000-0000-000000000000";
      await expect(repo.deleteThread(badId)).resolves.toBeUndefined();
    });
  });
});
