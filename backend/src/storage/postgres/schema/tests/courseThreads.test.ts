import {
  setupTestWithCleanup,
  shutdownSharedTestDB,
} from "../../testutil/shared_db";

import { CourseThreadRepositorySchema } from "../courseThreads";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { newPagination } from "../../../../utils/pagination";

import { student } from "../../../tables/student";
import { review } from "../../../tables/review";
import { course } from "../../../tables/course";
import { courseReview } from "../../../tables/courseReview";
import { v4 as uuidv4 } from "uuid";
import {department} from "../../../tables/department";

describe("CourseThreadRepositorySchema (DB)", () => {
  let db: NodePgDatabase;
  let repo: CourseThreadRepositorySchema;

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

  async function seedCourseReview() {
    const studentId = uuidv4();
    const reviewId = uuidv4();
    const courseId = uuidv4();

    await db.insert(student).values({
      id: studentId,
      firstName: "Test",
      lastName: "User",
      email: `${studentId}@test.com`,
    });

    const departmentID = 2;
    await db.insert(department).values({
      id: departmentID,
      name: "CS"
    })

    await db.insert(course).values({
      id: courseId,
      name: "Intro to Testing",
      departmentId: departmentID,
      courseCode: 2000,
      description: "Basic testing course",
      numCredits: 3,
    }).returning();

    await db.insert(review).values({
      id: reviewId,
      studentId,
    });

    await db.insert(courseReview).values({
      reviewId,
      courseId,
      rating: 5,
      reviewText: "Great course",
    });

    return { reviewId, studentId };
  }

  describe("getThreadsByCourseReviewId", () => {
    it("returns empty array when no threads", async () => {
      const { reviewId } = await seedCourseReview();

      const threads = await repo.getThreadsByCourseReviewId(
          reviewId,
          newPagination()
      );

      expect(threads).toEqual([]);
    });

    it("returns threads for the given course review id", async () => {
      const { reviewId, studentId } = await seedCourseReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "First thread",
      });

      const threads = await repo.getThreadsByCourseReviewId(
          reviewId,
          newPagination()
      );

      expect(threads).toHaveLength(1);

      const first = threads[0];
      expect(first).toBeDefined();
      expect(first!.id).toBe(created.id);
      expect(first!.content).toBe("First thread");
      expect(first!.courseReviewId).toBe(reviewId);
      expect(first!.studentId).toBe(studentId);
    });
  });

  describe("createThread", () => {
    it("inserts and returns thread with id and timestamps", async () => {
      const { reviewId, studentId } = await seedCourseReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "New thread content",
      });

      expect(created.id).toBeDefined();
      expect(created.courseReviewId).toBe(reviewId);
      expect(created.studentId).toBe(studentId);
      expect(created.content).toBe("New thread content");
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("patchThread", () => {
    it("updates content and returns updated thread", async () => {
      const { reviewId, studentId } = await seedCourseReview();

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
      const { reviewId, studentId } = await seedCourseReview();

      const created = await repo.createThread(reviewId, {
        studentId,
        content: "To delete",
      });

      await repo.deleteThread(created.id);

      const threads = await repo.getThreadsByCourseReviewId(
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