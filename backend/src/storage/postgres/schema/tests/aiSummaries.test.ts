import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB,
} from "../../testutil/shared_db";

import { AiSummaryRepositorySchema } from "../aiSummaries";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v4 as uuidv4 } from "uuid";

describe("AiSummaryRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: AiSummaryRepositorySchema;
    let testStudentId: string;
    let testCourseReviewId: string;
    let testProfReviewId: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new AiSummaryRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        testStudentId = uuidv4();
        testCourseReviewId = uuidv4();
        testProfReviewId = uuidv4();
        const courseId = uuidv4();
        const professorId = uuidv4();

        await db.execute(`
            INSERT INTO student (id, first_name, last_name, email)
            VALUES ('${testStudentId}', 'Test', 'User', '${testStudentId}@test.com');

            INSERT INTO department (name) VALUES ('CS') ON CONFLICT DO NOTHING;

            INSERT INTO course (id, name, department_id, course_code, description, num_credits)
            VALUES ('${courseId}', 'Test Course', 1, 9001, 'A test course', 3);

            INSERT INTO professor (id, first_name, last_name)
            VALUES ('${professorId}', 'Prof', 'Test') ON CONFLICT DO NOTHING;

            INSERT INTO review (id, student_id) VALUES ('${testCourseReviewId}', '${testStudentId}');
            INSERT INTO course_review (review_id, course_id, rating, review_text)
            VALUES ('${testCourseReviewId}', '${courseId}', 5, 'Great course');

            INSERT INTO review (id, student_id) VALUES ('${testProfReviewId}', '${testStudentId}');
            INSERT INTO professor_review (review_id, professor_id, rating, review_text)
            VALUES ('${testProfReviewId}', '${professorId}', 5, 'Great professor');
        `);
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    });

    describe("getByReviewId", () => {
        test("returns null when no summary exists for the given reviewId", async () => {
            const result = await repo.getByReviewId(testCourseReviewId, "course");

            expect(result).toBeNull();
        });


        test("returns the summary when it exists", async () => {
            await repo.upsertSummary({
                reviewId: testCourseReviewId,
                reviewType: "course",
                summary: "Test summary content",
                score: 7.5,
            });

            const result = await repo.getByReviewId(testCourseReviewId, "course");

            expect(result).not.toBeNull();
            expect(result!.reviewId).toBe(testCourseReviewId);
            expect(result!.reviewType).toBe("course");
            expect(result!.summary).toBe("Test summary content");
            expect(result!.score).toBeCloseTo(7.5);
            expect(result!.summaryUpdatedAt).toBeInstanceOf(Date);
        });
    });

    describe("upsertSummary", () => {
        test("inserts a new summary and returns the row", async () => {
            const result = await repo.upsertSummary({
                reviewId: testCourseReviewId,
                reviewType: "course",
                summary: "Initial summary",
                score: 3.5,
            });

            expect(result.id).toBeDefined();
            expect(result.reviewId).toBe(testCourseReviewId);
            expect(result.reviewType).toBe("course");
            expect(result.summary).toBe("Initial summary");
            expect(result.score).toBeCloseTo(3.5);
            expect(result.summaryUpdatedAt).toBeInstanceOf(Date);
            expect(result.createdAt).toBeInstanceOf(Date);
        });

        test("updates summary and score on conflict", async () => {
            await repo.upsertSummary({
                reviewId: testCourseReviewId,
                reviewType: "course",
                summary: "First version",
                score: 1.0,
            });

            const updated = await repo.upsertSummary({
                reviewId: testCourseReviewId,
                reviewType: "course",
                summary: "Second version",
                score: 9.0,
            });

            expect(updated.summary).toBe("Second version");
            expect(updated.score).toBeCloseTo(9.0);

            const fetched = await repo.getByReviewId(testCourseReviewId, "course");
            expect(fetched!.summary).toBe("Second version");
        });

        test("inserts independently for course and professor types", async () => {
            await repo.upsertSummary({ reviewId: testCourseReviewId, reviewType: "course", summary: "Course summary", score: 1 });
            await repo.upsertSummary({ reviewId: testProfReviewId, reviewType: "professor", summary: "Prof summary", score: 2 });

            const courseResult = await repo.getByReviewId(testCourseReviewId, "course");
            const profResult = await repo.getByReviewId(testProfReviewId, "professor");

            expect(courseResult!.summary).toBe("Course summary");
            expect(profResult!.summary).toBe("Prof summary");
        });
    });

    describe("getTopScoredReviews", () => {
        describe("empty DB", () => {
            beforeEach(async () => {
                await cleanupTestData();
            });

            test("returns empty array for course type", async () => {
                const results = await repo.getTopScoredReviews("course", 10);

                expect(results).toEqual([]);
            });

            test("returns empty array for professor type", async () => {
                const results = await repo.getTopScoredReviews("professor", 10);

                expect(results).toEqual([]);
            });
        });

        test("returns course reviews", async () => {
            const results = await repo.getTopScoredReviews("course", 10);

            expect(results.length).toBeGreaterThan(0);
            expect(results[0]!.reviewType).toBe("course");
            expect(results[0]!.reviewId).toBe(testCourseReviewId);
            expect(results[0]!.reviewText).toBe("Great course");
            expect(Number.isFinite(Number(results[0]!.score))).toBe(true);
        });

        test("returns professor reviews", async () => {
            const results = await repo.getTopScoredReviews("professor", 10);

            expect(results.length).toBeGreaterThan(0);
            expect(results[0]!.reviewType).toBe("professor");
            expect(results[0]!.reviewId).toBe(testProfReviewId);
            expect(results[0]!.reviewText).toBe("Great professor");
        });

        test("respects the limit parameter", async () => {
            const results = await repo.getTopScoredReviews("course", 1);

            expect(results.length).toBeLessThanOrEqual(1);
        });

        test("returns only the top-scored review per course when multiple reviews exist for the same course", async () => {
            const secondReviewId = uuidv4();
            const threadStudentId = uuidv4();

            await db.execute(`
                INSERT INTO student (id, first_name, last_name, email)
                VALUES ('${threadStudentId}', 'Thread', 'User', '${threadStudentId}@test.com');

                INSERT INTO review (id, student_id) VALUES ('${secondReviewId}', '${testStudentId}');
                INSERT INTO course_review (review_id, course_id, rating, review_text)
                VALUES ('${secondReviewId}', (SELECT course_id FROM course_review WHERE review_id = '${testCourseReviewId}'), 4, 'Hot take');

                INSERT INTO course_thread (student_id, course_review_id, content)
                VALUES ('${threadStudentId}', '${secondReviewId}', 'discussion');
            `);

            const results = await repo.getTopScoredReviews("course", 10);

            const reviewIds = results.map(r => r.reviewId);
            expect(reviewIds).toContain(secondReviewId);
            expect(reviewIds).not.toContain(testCourseReviewId);
        });

        test("returns only the top-scored review per professor when multiple reviews exist for the same professor", async () => {
            const secondReviewId = uuidv4();
            const threadStudentId = uuidv4();

            await db.execute(`
                INSERT INTO student (id, first_name, last_name, email)
                VALUES ('${threadStudentId}', 'Thread', 'User', '${threadStudentId}@test.com');

                INSERT INTO review (id, student_id) VALUES ('${secondReviewId}', '${testStudentId}');
                INSERT INTO professor_review (review_id, professor_id, rating, review_text)
                VALUES ('${secondReviewId}', (SELECT professor_id FROM professor_review WHERE review_id = '${testProfReviewId}'), 4, 'Hot take');

                INSERT INTO professor_thread (student_id, professor_review_id, content)
                VALUES ('${threadStudentId}', '${secondReviewId}', 'discussion');
            `);

            const results = await repo.getTopScoredReviews("professor", 10);

            const reviewIds = results.map(r => r.reviewId);
            expect(reviewIds).toContain(secondReviewId);
            expect(reviewIds).not.toContain(testProfReviewId);
        });

        test("returns reviews from different courses without collapsing them", async () => {
            const otherCourseId = uuidv4();
            const otherReviewId = uuidv4();

            await db.execute(`
                INSERT INTO course (id, name, department_id, course_code, description, num_credits)
                VALUES ('${otherCourseId}', 'Other Course', 1, 9002, 'Another test course', 3);

                INSERT INTO review (id, student_id) VALUES ('${otherReviewId}', '${testStudentId}');
                INSERT INTO course_review (review_id, course_id, rating, review_text)
                VALUES ('${otherReviewId}', '${otherCourseId}', 5, 'Other course review');
            `);

            const results = await repo.getTopScoredReviews("course", 10);
            const reviewIds = results.map(r => r.reviewId);

            expect(reviewIds).toContain(testCourseReviewId);
            expect(reviewIds).toContain(otherReviewId);
        });
    });

    describe("markStaleIfThresholdMet", () => {
        test("does nothing when no summary exists for the reviewId", async () => {
            await expect(
                repo.markStaleIfThresholdMet(testCourseReviewId, "course", 0.5),
            ).resolves.toBeUndefined();
        });

        test("does not mark stale when threshold is not met", async () => {
            await repo.upsertSummary({ reviewId: testCourseReviewId, reviewType: "course", summary: "Summary", score: 5 });

            await repo.markStaleIfThresholdMet(testCourseReviewId, "course", 1.0);

            const result = await repo.getByReviewId(testCourseReviewId, "course");
            expect(result!.summaryUpdatedAt.getTime()).toBeGreaterThan(new Date("2001-01-01").getTime());
        });

        test("marks summary stale when threshold is met", async () => {
            await repo.upsertSummary({ reviewId: testCourseReviewId, reviewType: "course", summary: "Summary", score: 5 });

            await repo.markStaleIfThresholdMet(testCourseReviewId, "course", 0);

            const result = await repo.getByReviewId(testCourseReviewId, "course");
            expect(result!.summaryUpdatedAt.getTime()).toBeLessThan(new Date("1971-01-01").getTime());
        });
    });
});
