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
      const parentId = await repo.createParentReview({ studentId: testStudentId });
      await expect(
        repo.createCourseReview(parentId, {
          courseId: uuid(), // non-existent course
          rating: 4,
          reviewText: "Great!",
        }),
      ).rejects.toThrow();

      // Valid input
      const parentId2 = await repo.createParentReview({ studentId: testStudentId });
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
      const parentId = await repo.createParentReview({ studentId: testStudentId });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 5,
        reviewText: "Amazing!",
        tags: ["easy_a"],
      });
      expect(created.tags).toEqual(["easy_a"]);
    });

    test("creates with semester and year", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId, semester: "fall", year: 2026 });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "fall semester course",
      }); 
      expect(created.semester).toBe("fall");
      expect(created.year).toBe(2026);
    });

    test("creates null semester and year", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 3,
        reviewText: "no semester and year",
      });
      expect(created.semester).toBeNull();
      expect(created.year).toBeNull();
    });
  });

  describe("duplicate course review prevention", () => {
    test("throws if same student reviews same course twice", async () => {
      const p1 = await repo.createParentReview({ studentId: testStudentId });
      await repo.createCourseReview(p1, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "First review",
      });

      const p2 = await repo.createParentReview({ studentId: testStudentId });
      await expect(
        repo.createCourseReview(p2, {
          courseId: testCourseId,
          rating: 3,
          reviewText: "Duplicate review",
        }),
      ).rejects.toThrow("Student has already submitted a review for this course");
    });

    test("allows different students to review the same course", async () => {
      const otherStudentId = uuid();
      await db.execute(`
        INSERT INTO student (id, first_name, last_name, email)
        VALUES ('${otherStudentId}', 'Other', 'Student', '${otherStudentId}@test.com');
      `);

      const p1 = await repo.createParentReview({ studentId: testStudentId });
      await repo.createCourseReview(p1, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "Student 1 review",
      });

      const p2 = await repo.createParentReview({ studentId: otherStudentId });
      await expect(
        repo.createCourseReview(p2, {
          courseId: testCourseId,
          rating: 5,
          reviewText: "Student 2 review",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("duplicate professor review prevention", () => {
    test("throws if same student reviews same professor twice", async () => {
      const p1 = await repo.createParentReview({ studentId: testStudentId });
      await repo.createProfessorReview(p1, {
        professorId: testprofessorId,
        rating: 5,
        reviewText: "First review",
      });

      const p2 = await repo.createParentReview({ studentId: testStudentId });
      await expect(
        repo.createProfessorReview(p2, {
          professorId: testprofessorId,
          rating: 3,
          reviewText: "Duplicate review",
        }),
      ).rejects.toThrow("Student has already submitted a review for this professor");
    });

    test("allows different students to review the same professor", async () => {
      const otherStudentId = uuid();
      await db.execute(`
        INSERT INTO student (id, first_name, last_name, email)
        VALUES ('${otherStudentId}', 'Other', 'Student', '${otherStudentId}@test.com');
      `);

      const p1 = await repo.createParentReview({ studentId: testStudentId });
      await repo.createProfessorReview(p1, {
        professorId: testprofessorId,
        rating: 4,
        reviewText: "Student 1 review",
      });

      const p2 = await repo.createParentReview({ studentId: otherStudentId });
      await expect(
        repo.createProfessorReview(p2, {
          professorId: testprofessorId,
          rating: 5,
          reviewText: "Student 2 review",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("createParentReview + createProfessorReview", () => {
    test("bad input first, good input next", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId });
      await expect(
        repo.createProfessorReview(parentId, {
          professorId: uuid(), // non-existent professor
          rating: 4,
          reviewText: "Great!",
        }),
      ).rejects.toThrow();

      const parentId2 = await repo.createParentReview({ studentId: testStudentId });
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

      const parentId = await repo.createParentReview({ studentId: testStudentId });
      await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 3,
        reviewText: "Decent course",
      });

      results = await repo.getReviews(pagination);
      expect(results).toHaveLength(1);
    });

    test("pagination limit works", async () => {
      const otherStudentId = uuid();
      await db.execute(`
        INSERT INTO student (id, first_name, last_name, email)
        VALUES ('${otherStudentId}', 'Pagination', 'Student', '${otherStudentId}@test.com');
      `);

      const p1 = await repo.createParentReview({ studentId: testStudentId });
      await repo.createCourseReview(p1, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "First",
      });
      const p2 = await repo.createParentReview({ studentId: otherStudentId });
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

      const parentId = await repo.createParentReview({ studentId: testStudentId });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 5,
        reviewText: "Excellent!",
      });

      const found = await repo.getReviewByID(created.reviewId);
      expect(found.reviewId).toBe(created.reviewId);
      expect("courseId" in found).toBe(true);
    });

    test("includes semester and year in result", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId, semester: "summer_2", year: 2024 });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 5,
        reviewText: "Summer course!",
      });

      const found = await repo.getReviewByID(created.reviewId);
      expect(found.semester).toBe("summer_2");
      expect(found.year).toBe(2024);
    });
  });

  describe("patchReview", () => {
    test("non-existent ID first, valid update next", async () => {
      await expect(repo.patchReview(uuid(), { rating: 3 })).rejects.toThrow();

      const parentId = await repo.createParentReview({ studentId: testStudentId });
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
      const parentId = await repo.createParentReview({ studentId: testStudentId });
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

    test("patches semester and year", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId });
      const created = await repo.createCourseReview(parentId, {
        courseId: testCourseId,
        rating: 4,
        reviewText: "Original text",
      });

      const patched = await repo.patchReview(created.reviewId, {
        semester: "spring",
        year: 2025,
      });
      expect(patched.semester).toBe("spring");
      expect(patched.year).toBe(2025);
      expect(patched.rating).toBe(4);
    });


  });

  describe("deleteReview", () => {
    test("deletes and cascades to child table", async () => {
      const parentId = await repo.createParentReview({ studentId: testStudentId });
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
