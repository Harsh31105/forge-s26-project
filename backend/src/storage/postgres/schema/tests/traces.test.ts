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
                semester: "fall",
                lectureYear: 2024,
                lectureType: "lecture",
                howOftenPercentage: 80,
                hoursDevoted: 10,
                professorEfficiency: "4.50",
                eval: "Great",
            },
            {
                courseId: testCourseId,
                professorId: testProfessorId,
                courseName: "Algorithms",
                departmentId: testDepartmentId,
                courseCode: 5800,
                semester: "spring",
                lectureYear: 2023,
                lectureType: "lecture",
                howOftenPercentage: 60,
                hoursDevoted: 12,
                professorEfficiency: "3.80",
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
});