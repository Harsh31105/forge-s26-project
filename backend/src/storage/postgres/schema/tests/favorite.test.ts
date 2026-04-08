import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { FavouriteRepositorySchema } from "../favourites";
import { student } from "../../../tables/student";
import { course } from "../../../tables/course";
import { department } from "../../../tables/department";
import {
    setupTestWithCleanup,
    cleanupTestData,
    shutdownSharedTestDB
} from "../../testutil/shared_db";

describe("FavouriteRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: FavouriteRepositorySchema;
    let testStudentId: string;
    let testCourseId: string;
    let testDepartmentId: number;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new FavouriteRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const [deptRow] = await db
            .insert(department)
            .values({ name: "TestDept" })
            .returning();
        testDepartmentId = deptRow!.id;

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

        testCourseId = uuid();
        await db.insert(course).values({
            id: testCourseId,
            name: "Intro CS",
            departmentId: testDepartmentId,
            courseCode: 1010,
            description: "Test course",
            numCredits: 3,
            lectureType: "lecture",
            createdAt: new Date(),
            updatedAt: new Date()
        });
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("postFavourite & getFavourites", () => {
        test("can create and retrieve a favourite", async () => {
            const fav = await repo.postFavourite(testStudentId, { course_id: testCourseId });

            expect(fav.studentId).toBe(testStudentId);
            expect(fav.courseId).toBe(testCourseId);
            expect(fav.createdAt).toBeInstanceOf(Date);
            expect(fav.updatedAt).toBeInstanceOf(Date);

            const favs = await repo.getFavourites(testStudentId);
            expect(favs).toHaveLength(1);
            expect(favs[0]!.courseId).toBe(testCourseId);
        });
    });

    describe("getStudentIDsWhoFavourited", () => {
        test("retrieves students for a course", async () => {
            await repo.postFavourite(testStudentId, { course_id: testCourseId });

            const students = await repo.getStudentIDsWhoFavourited(testCourseId);
            expect(students).toHaveLength(1);
            expect(students[0]!.studentId).toBe(testStudentId);
        });
    });

    describe("deleteFavourite", () => {
        test("removes a favourite", async () => {
            await repo.postFavourite(testStudentId, { course_id: testCourseId });

            await repo.deleteFavourite(testStudentId, testCourseId);

            const favs = await repo.getFavourites(testStudentId);
            expect(favs).toHaveLength(0);
        });
    });
});