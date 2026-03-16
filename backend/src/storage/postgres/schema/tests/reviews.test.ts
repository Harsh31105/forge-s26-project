import {
  setupTestWithCleanup,
  shutdownSharedTestDB,
} from "../../testutil/shared_db";
import { ReviewRepositorySchema } from "../reviews";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { NotFoundError } from "../../../../errs/httpError";

describe("ReviewRepositorySchema DB Integration", () => {
  let db!: NodePgDatabase;
  let repo!: ReviewRepositorySchema;
  let testStudentId: string;
  let testCourseId: string;
  let testprofessorId: string;

  beforeAll(async () => {
    db = await setupTestWithCleanup();
    repo = new ReviewRepositorySchema(db);
  }, 30000);

  beforeEach(async () => {
    // Clean up review-related data only
    await db.execute(`TRUNCATE TABLE review RESTART IDENTITY CASCADE`);
    await db.execute(
      `TRUNCATE TABLE student, professor, course RESTART IDENTITY CASCADE`,
    );

    testStudentId = uuid();
    testCourseId = uuid();
    testprofessorId = uuid();

    await db.execute(`
            INSERT INTO student (id, first_name, last_name, email)
            VALUES ('${testStudentId}', 'Test', 'Student', '${testStudentId}@test.com');

            INSERT INTO department (name) VALUES ('CS') ON CONFLICT DO NOTHING;

            INSERT INTO course (id, name, department_id, course_code, description, num_credits)
            VALUES ('${testCourseId}', 'Test Course', 1, 1000, 'A test course', 3);

            INSERT INTO professor (id, first_name, last_name)
            VALUES ('${testprofessorId}', 'Test', 'Prof');
        `);
  });

  afterAll(async () => {
    await shutdownSharedTestDB();
  });

  describe("createParentReview + createCourseReview", () => {
    test("bad input first, good input next", async () => {
      // Invalid course ID should fail FK constraint
      const parentId = await repo.createParentReview(testStudentId);
      await expect(
        repo.createCourseReview(parentId, {
          courseId: uuid(), // non-existent course
          rating: 4,
          reviewText: "Great!",
        }),
      ).rejects.toThrow();

      // Valid input
      const parentId2 = await repo.createParentReview(testStudentId);
      const created = await repo.createCourseReview(parentId2, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "Great course!",
      });
      expect(created.courseId).toBe(testCourseId);
      expect(created.rating).toBe(4);
      expect(created.reviewText).toBe("Great course!");
    });

    test("creates with tags", async () => {
      const parentId = await repo.createParentReview(testStudentId);
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 5,
        reviewText: "Amazing!",
        tags: ["easy_a"],
      });
      expect(created.tags).toEqual(["easy_a"]);
    });
  });

  describe("createParentReview + createProfessorReview", () => {
    test("bad input first, good input next", async () => {
      const parentId = await repo.createParentReview(testStudentId);
      await expect(
        repo.createProfessorReview(parentId, {
          professorId: uuid(), // non-existent professor
          rating: 4,
          reviewText: "Great!",
        }),
      ).rejects.toThrow();

      const parentId2 = await repo.createParentReview(testStudentId);
      const created = await repo.createProfessorReview(parentId2, {
        professorId: testprofessorId,
        rating: 5,
        reviewText: "Excellent professor!",
      });
      expect(created.professorId).toBe(testprofessorId);
      expect(created.rating).toBe(5);
    });
  });

  describe("getReviews", () => {
    test("empty and populated DB", async () => {
      const pagination = { limit: 20, page: 1 };

      let results = await repo.getReviews(pagination);
      expect(results).toEqual([]);

      const parentId = await repo.createParentReview(testStudentId);
      await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 3,
        reviewText: "Decent course",
      });

      results = await repo.getReviews(pagination);
      expect(results).toHaveLength(1);
    });

    test("pagination limit works", async () => {
      const p1 = await repo.createParentReview(testStudentId);
      await repo.createCourseReview(p1, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "First",
      });
      const p2 = await repo.createParentReview(testStudentId);
      await repo.createCourseReview(p2, {
        courseId: testCourseId,
        rating: 3,
        reviewText: "Second",
      });

      const results = await repo.getReviews({ limit: 1, page: 1 });
      expect(results).toHaveLength(1);
    });
  });

  describe("getReviewByID", () => {
    test("invalid ID first, valid ID next", async () => {
      await expect(repo.getReviewByID(uuid())).rejects.toThrow(NotFoundError);

      const parentId = await repo.createParentReview(testStudentId);
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 5,
        reviewText: "Excellent!",
      });

      const found = await repo.getReviewByID(created.reviewId);
      expect(found.reviewId).toBe(created.reviewId);
      expect("courseId" in found).toBe(true);
    });
  });

  describe("patchReview", () => {
    test("non-existent ID first, valid update next", async () => {
      await expect(repo.patchReview(uuid(), { rating: 3 })).rejects.toThrow();

      const parentId = await repo.createParentReview(testStudentId);
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "Original text",
      });

      const patched = await repo.patchReview(created.reviewId, { rating: 2 });
      expect(patched.rating).toBe(2);
      // Unprovided field should be unchanged
      expect(patched.reviewText).toBe("Original text");
    });

    test("patches professor review", async () => {
      const parentId = await repo.createParentReview(testStudentId);
      const created = await repo.createProfessorReview(parentId, {
        professorId: testprofessorId,
        rating: 3,
        reviewText: "Decent",
      });

      const patched = await repo.patchReview(created.reviewId, {
        reviewText: "Updated!",
      });
      expect(patched.reviewText).toBe("Updated!");
      expect(patched.rating).toBe(3);
    });
  });

  describe("deleteReview", () => {
    test("deletes and cascades to child table", async () => {
      const parentId = await repo.createParentReview(testStudentId);
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "To be deleted",
      });

      await expect(repo.deleteReview(created.reviewId)).resolves.not.toThrow();
      await expect(repo.getReviewByID(created.reviewId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
