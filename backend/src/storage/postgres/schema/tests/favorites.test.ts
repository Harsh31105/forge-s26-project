import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { FavoritesRepositorySchema } from "../favorites";
import { favorite } from "../../../tables/favorite";
import { student } from "../../../tables/student";
import { course } from "../../../tables/course";
import { department } from "../../../tables/department";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { newPagination } from "../../../../utils/pagination";

describe("FavoriteRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: FavoritesRepositorySchema;
    let testStudentId: string;
    let testCourseId: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new FavoritesRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const [studentRow] = await db.insert(student).values({
            firstName: "Amy",
            lastName: "Shok",
            email: `${uuid()}@example.com`,
            graduationYear: 2027,
        }).returning();

        if (!studentRow) throw new Error("Failed to create student");
        testStudentId = studentRow.id;

        const [departmentRow] = await db.insert(department).values({
            name: "CS",
        }).returning();

        if (!departmentRow) throw new Error("Failed to create department");

        const [courseRow] = await db.insert(course).values({
            name: "Test Course",
            departmentId: departmentRow.id,
            courseCode: 2500,
            description: "Test course description",
            numCredits: 4,
            lectureType: "lecture",
        }).returning();

        if (!courseRow) throw new Error("Failed to create course");
        testCourseId = courseRow.id;

        await db.insert(favorite).values({
            studentId: testStudentId,
            courseId: testCourseId,
        });
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    });

    describe("getFavorites", () => {
        test("empty and populated DB", async () => {
            await repo.deleteFavorite(testStudentId, testCourseId);

            const pagination = newPagination();
            let results = await repo.getFavorites(pagination);
            expect(results).toEqual([]);

            await db.insert(favorite).values({
                studentId: testStudentId,
                courseId: testCourseId,
            });

            results = await repo.getFavorites(pagination);
            expect(results).toHaveLength(1);
            expect(results[0]!.student_id).toBe(testStudentId);
            expect(results[0]!.course_id).toBe(testCourseId);
        });
    });

    describe("createFavorite", () => {
        test("bad input first, good input next", async () => {
            await expect(repo.createFavorite({} as any)).rejects.toThrow();

            const [newStudentRow] = await db.insert(student).values({
                firstName: "New",
                lastName: "Student",
                email: `${uuid()}@example.com`,
                graduationYear: 2028,
            }).returning();

            if (!newStudentRow) throw new Error("Failed to create new student");

            const [newDepartmentRow] = await db.insert(department).values({
                name: "EECE",
            }).returning();

            if (!newDepartmentRow) throw new Error("Failed to create new department");

            const [newCourseRow] = await db.insert(course).values({
                name: "New Test Course",
                departmentId: newDepartmentRow.id,
                courseCode: 2210,
                description: "Another test course",
                numCredits: 4,
                lectureType: "lecture",
            }).returning();

            if (!newCourseRow) throw new Error("Failed to create new course");

            const createdFavorite = await repo.createFavorite({
                student_id: newStudentRow.id,
                course_id: newCourseRow.id
            });

            expect(createdFavorite.student_id).toBe(newStudentRow.id);
            expect(createdFavorite.course_id).toBe(newCourseRow.id);
        });
    });

    describe("deleteFavorite", () => {
        test("invalid ID first, valid deletion next", async () => {
            await expect(
                repo.deleteFavorite(testStudentId, testCourseId)
            ).resolves.not.toThrow();
        });
    });
});