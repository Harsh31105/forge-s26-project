/**
 * DB tests for ProfThreadRepositorySchema.
 * Require Docker (testcontainers) to be running. Run with: npm test -- src/storage/postgres/schema/tests/profThreads.test.ts
 */
import {
  setupTestWithCleanup,
  shutdownSharedTestDB,
} from "../../testutil/shared_db";
import { ProfThreadRepositorySchema } from "../profThread";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { newPagination } from "../../../../utils/pagination";

  //const professorReviewId = "11111111-1111-1111-1111-111111111111";
  //const studentId = "22222222-2222-2222-2222-222222222222";

import { student } from "../../../tables/student";
import { review } from "../../../tables/review";
//import { course } from "../../../tables/course";
import { professor } from "../../../tables/professor";
import { profReview } from "../../../tables/profReview";
import { v4 as uuidv4 } from "uuid";
import {department} from "../../../tables/department";

describe("ProfThreadRepositorySchema (DB)", () => {
  let db: NodePgDatabase;
  let repo: ProfThreadRepositorySchema;

  beforeAll(async () => {
    db = await setupTestWithCleanup();
    repo = new ProfThreadRepositorySchema(db);
  }, 60_000);

  afterAll(async () => {
    await shutdownSharedTestDB();
  });

  beforeEach(async () => {
    await setupTestWithCleanup();
  });

  async function seedProfReview() {
    const studentId = uuidv4();
    const reviewId = uuidv4();
    const professorId = uuidv4();

    await db.insert(student).values({
      id: studentId,
      firstName: "Test",
      lastName: "User",
      email: `${studentId}@test.com`,
    });

    await db.insert(professor).values({
      id: professorId,
      firstName: "Prof",
      lastName: "Test",
    });

    // ADD THIS: Insert the review record first - copilot fix
    await db.insert(review).values({
      id: reviewId,
      studentId,
  });

    await db.insert(profReview).values({
      reviewId: reviewId,
      //studentId,
      professorId,
      rating: 5,
      reviewText: "Great professor",
    });

    return { reviewId, studentId, professorId };
  }

  describe("getThreadsByProfessorReviewId", () => {
    it("returns empty array when no threads", async () => {
      const { reviewId } = await seedProfReview();

      const threads = await repo.getThreadsByProfessorReviewId(
          reviewId,
          newPagination()
      );

      expect(threads).toEqual([]);
    });

    it("returns threads for the given professor review id", async () => {
      const { reviewId, studentId } = await seedProfReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "First thread",
      });

      const threads = await repo.getThreadsByProfessorReviewId(
          reviewId,
          newPagination()
      );

      expect(threads).toHaveLength(1);

      const first = threads[0];
      expect(first).toBeDefined();
      expect(first!.id).toBe(created.id);
      expect(first!.studentId).toBe(studentId);
      expect(first!.professorReviewId).toBe(reviewId);
      expect(first!.content).toBe("First thread");
    });
  });

  describe("createThread", () => {
    it("inserts and returns thread with id and timestamps", async () => {
      const { reviewId, studentId } = await seedProfReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "New thread content",
      });
      expect(created.id).toBeDefined();
      expect(created.studentId).toBe(studentId);
      expect(created.professorReviewId).toBe(reviewId);
      expect(created.content).toBe("New thread content");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("patchThread", () => {
    it("updates content and returns updated thread", async () => {
      const { reviewId, studentId } = await seedProfReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "Original",
      });

      const updated = await repo.patchThread(created.id, {
        content: "Updated content",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.content).toBe("Updated content");
    });

    it("throws when thread does not exist", async () => {
      const badId = uuidv4();

      await expect(
          repo.patchThread(badId, { content: "x" })
      ).rejects.toThrow();
    });
  });

  describe("deleteThread", () => {
    it("deletes thread by id", async () => {
      const { reviewId, studentId } = await seedProfReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "To delete",
      });

      await repo.deleteThread(created.id);

      const threads = await repo.getThreadsByProfessorReviewId(
          reviewId,
          newPagination()
      );

      expect(threads).toHaveLength(0);
    });

    it("does not throw when thread does not exist", async () => {
      const badId = uuidv4();

      await expect(repo.deleteThread(badId)).resolves.toBeUndefined();
    });
  });
});