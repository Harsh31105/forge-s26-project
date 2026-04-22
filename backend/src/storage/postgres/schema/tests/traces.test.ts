import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { student } from "../../../tables/student";
import { course } from "../../../tables/course";
import { department } from "../../../tables/department";
import { professor } from "../../../tables/professor";
import { trace } from "../../../tables/trace";
import { v4 as uuid } from "uuid";

import {
    setupTestWithCleanup,
    cleanupTestData,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import {Trace} from "../../../../models/trace";
import { TraceRepositorySchema } from "../traces";

describe("TraceRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: TraceRepositorySchema;

    let testStudentId: string;
    let testCourseId: string;
    let testDepartmentId: number;
    let testProfessorId: string;

    let profID1: string;
    let profID2: string;
    let profID3: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new TraceRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        // Department
        const [deptRow] = await db
            .insert(department)
            .values({ name: "CS" })
            .returning();
        testDepartmentId = deptRow!.id;

        // Student (not directly used but good for consistency)
        testStudentId = uuid();
        await db.insert(student).values({
            id: testStudentId,
            firstName: "Test",
            lastName: "Student",
            email: `${testStudentId}@test.com`,
            graduationYear: 2026,
            preferences: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Professor
        testProfessorId = uuid();
        await db.insert(professor).values({
            id: testProfessorId,
            firstName: "Prof",
            lastName: "X",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Course
        testCourseId = uuid();
        await db.insert(course).values({
            id: testCourseId,
            name: "Algorithms",
            departmentId: testDepartmentId,
            courseCode: 5800,
            description: "Test course",
            numCredits: 4,
            lectureType: "lecture",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Insert TRACE rows
        await db.insert(trace).values([
            {
                courseId: testCourseId,
                professorId: testProfessorId,
                courseName: "Algorithms",
                departmentId: testDepartmentId,
                courseCode: 5800,
                semester: "fall" as const,
                lectureYear: 2024,
                lectureType: "lecture" as const,
                section: "01",
                howOftenPercentage: { "80-100%": 80 },
                hoursDevoted: { "3-4": 10 },
                professorEfficiency: 4.50,
                eval: "Great",
            },
            {
                courseId: testCourseId,
                professorId: testProfessorId,
                courseName: "Algorithms",
                departmentId: testDepartmentId,
                courseCode: 5800,
                semester: "spring" as const,
                lectureYear: 2023,
                lectureType: "lecture" as const,
                section: "02",
                howOftenPercentage: { "80-100%": 60 },
                hoursDevoted: { "3-4": 12 },
                professorEfficiency: 3.80,
                eval: "Okay",
            }
        ]);
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("getTraces", () => {

        test("retrieves all traces (no filters)", async () => {
            const traces = await repo.getTraces(
                { page: 1, limit: 10 },
                {}
            );

            expect(traces.length).toBeGreaterThanOrEqual(2);
            expect(traces[0]!.courseId).toBe(testCourseId);
        });

        test("filters by courseId", async () => {
            const traces :Trace[] = await repo.getTraces(
                { page: 1, limit: 10 },
                { courseId: testCourseId }
            );

            expect(traces.length).toBeGreaterThanOrEqual(2);
            traces.forEach(t => {
                expect(t.courseId).toBe(testCourseId);
            });
        });

        test("filters by professorId", async () => {
            const traces :Trace[] = await repo.getTraces(
                { page: 1, limit: 10 },
                { professorId: testProfessorId }
            );

            expect(traces.length).toBeGreaterThanOrEqual(2);
            traces.forEach(t => {
                expect(t.professorId).toBe(testProfessorId);
            });
        });

        test("filters by departmentId", async () => {
            const traces :Trace[] = await repo.getTraces(
                { page: 1, limit: 10 },
                { departmentId: testDepartmentId }
            );

            expect(traces.length).toBeGreaterThanOrEqual(2);
            traces.forEach(t => {
                expect(t.departmentId).toBe(testDepartmentId);
            });
        });

        test("filters by semester", async () => {
            const traces :Trace[] = await repo.getTraces(
                { page: 1, limit: 10 },
                { semester: "fall" }
            );

            expect(traces.length).toBeGreaterThanOrEqual(1);
            traces.forEach(t => {
                expect(t.semester).toBe("fall");
            });
        });

        test("pagination works", async () => {
            const traces = await repo.getTraces(
                { page: 1, limit: 1 },
                {}
            );

            expect(traces).toHaveLength(1);
        });

        test("returns empty array if no match", async () => {
            const traces = await repo.getTraces(
                { page: 1, limit: 10 },
                { departmentId: 999999 }
            );

            expect(traces).toHaveLength(0);
        });
    });

    describe("getBestProfessorsByCourseID", () => {
        test("returns professors sorted by avg efficiency descending across multiple sections and semesters", async () => {
            // insert 2 more professors
            profID1 = uuid();
            profID2 = uuid();
            profID3 = testProfessorId; // reuse existing prof as Carol

            await db.insert(professor).values([
                { id: profID1, firstName: "Alice", lastName: "Smith", tags: null, createdAt: new Date(), updatedAt: new Date() },
                { id: profID2, firstName: "Bob", lastName: "Jones", tags: null, createdAt: new Date(), updatedAt: new Date() },
            ]);

            // Alice: spring 2024 (4.5) + fall 2024 (4.0) → avg 4.25
            // Bob: spring 2024 (3.0) + spring 2025 (3.5) + fall 2024 (3.0) → avg ~3.17
            // existing prof (Carol): already has fall 2024 (4.50) + spring 2023 (3.80) → avg 4.15
            await db.insert(trace).values([
                {
                    courseId: testCourseId, professorId: profID1,
                    courseName: "Algorithms", departmentId: testDepartmentId,
                    courseCode: 5800, semester: "spring" as const, lectureYear: 2024, lectureType: "lecture" as const,
                    section: "01", howOftenPercentage: { "80-100%": 80 }, hoursDevoted: { "3-4": 8 }, professorEfficiency: 4.5,
                },
                {
                    courseId: testCourseId, professorId: profID1,
                    courseName: "Algorithms", departmentId: testDepartmentId,
                    courseCode: 5800, semester: "fall" as const, lectureYear: 2024, lectureType: "lecture" as const,
                    section: "01", howOftenPercentage: { "80-100%": 75 }, hoursDevoted: { "3-4": 9 }, professorEfficiency: 4.0,
                },
                {
                    courseId: testCourseId, professorId: profID2,
                    courseName: "Algorithms", departmentId: testDepartmentId,
                    courseCode: 5800, semester: "spring" as const, lectureYear: 2024, lectureType: "lecture" as const,
                    section: "01", howOftenPercentage: { "80-100%": 70 }, hoursDevoted: { "3-4": 7 }, professorEfficiency: 3.0,
                },
                {
                    courseId: testCourseId, professorId: profID2,
                    courseName: "Algorithms", departmentId: testDepartmentId,
                    courseCode: 5800, semester: "spring" as const, lectureYear: 2025, lectureType: "lecture" as const,
                    section: "01", howOftenPercentage: { "80-100%": 72 }, hoursDevoted: { "3-4": 8 }, professorEfficiency: 3.5,
                },
                {
                    courseId: testCourseId, professorId: profID2,
                    courseName: "Algorithms", departmentId: testDepartmentId,
                    courseCode: 5800, semester: "fall" as const, lectureYear: 2024, lectureType: "lecture" as const,
                    section: "01", howOftenPercentage: { "80-100%": 68 }, hoursDevoted: { "3-4": 7 }, professorEfficiency: 3.0,
                },
            ]);

            const results = await repo.getBestProfessorsByCourseID(testCourseId);

            expect(results.length).toBe(3);
            // Alice avg 4.25 should be first
            expect(results[0]!.id).toBe(profID1);
            expect(results[0]!.firstName).toBe("Alice");
            // Bob avg ~3.17 should be last
            expect(results[2]!.id).toBe(profID2);
            expect(results[2]!.firstName).toBe("Bob");
        });

        test("returns empty array when no trace data for course", async () => {
            const fakeCourseId = uuid();
            const results = await repo.getBestProfessorsByCourseID(fakeCourseId);
            expect(results).toEqual([]);
        });
    });
});