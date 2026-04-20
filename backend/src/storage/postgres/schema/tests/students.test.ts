import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import {StudentRepositorySchema} from "../students";
import { student } from "../../../tables/student";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { newPagination } from "../../../../utils/pagination";
import {id} from "zod/locales";

describe("StudentRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: StudentRepositorySchema;
    let testStudentID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new StudentRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const id = uuid();

        await db.insert(student).values({
            id,
            firstName: "Test",
            lastName: "Student",
            email: `${id}@test.com`,
            graduationYear: 2026,
            preferences: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        testStudentID = id;
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("getStudents", () => {
        test("empty and populated DB", async () => {
            await repo.deleteStudent(testStudentID);

            const pagination = newPagination();
            let results = await repo.getStudents(pagination);

            expect(results).toEqual([]);

            await db.insert(student).values({
                id: testStudentID,
                firstName: "Test",
                lastName: "Student",
                email: `${id}@test.com`,
                graduationYear: 2026,
                preferences: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            results = await repo.getStudents(pagination);

            expect(results).toHaveLength(1);
            expect(results[0]!.id).toBe(testStudentID);
        });
    });

    describe("getStudentByID", () => {
        test("invalid ID first, valid ID next", async () => {
            const invalidId = uuid();

            await expect(
                repo.getStudentByID(invalidId)
            ).rejects.toThrow(Error);

            const studentResult = await repo.getStudentByID(testStudentID);

            expect(studentResult.id).toBe(testStudentID);
        });
    });

    describe("getStudentByEmail", () => {
        test("non-existent email first, valid email next", async () => {
            const invalidEmail = "nonexistent@test.com";

            await expect(
                repo.getStudentByEmail(invalidEmail)
            ).rejects.toThrow("student not found");

            const validEmail = `${testStudentID}@test.com`;
            const studentResult = await repo.getStudentByEmail(validEmail);

            expect(studentResult.email).toBe(validEmail);
            expect(studentResult.id).toBe(testStudentID);
            expect(studentResult.firstName).toBe("Test");
            expect(studentResult.lastName).toBe("Student");
        });
    });

    describe("createStudent", () => {
        test("create new student", async () => {
            const newStudent = await repo.createStudent({
                firstName: "New",
                lastName: "Student",
                email: "new@test.com",
                graduationYear: 2027,
                preferences: []
            });

            expect(newStudent.firstName).toBe("New");
        });
    });

    describe("patchStudent", () => {
        test("non-existent ID first, valid update next", async () => {
            const invalidId = uuid();

            await expect(
                repo.patchStudent(invalidId, { firstName: "Fail" })
            ).rejects.toThrow(Error);

            const updated = await repo.patchStudent(testStudentID, {
                firstName: "Updated"
            });

            expect(updated.firstName).toBe("Updated");
        });

        test("stores and retrieves profilePictureKey", async () => {
            const key = "profile-pictures/test-student.jpg";

            const updated = await repo.patchStudent(testStudentID, { profilePictureKey: key });
            expect(updated.profilePictureKey).toBe(key);

            const fetched = await repo.getStudentByID(testStudentID);
            expect(fetched.profilePictureKey).toBe(key);
        });

        test("clears profilePictureKey when set to null", async () => {
            const key = "profile-pictures/test-student.jpg";
            await repo.patchStudent(testStudentID, { profilePictureKey: key });

            const cleared = await repo.patchStudent(testStudentID, { profilePictureKey: null });
            expect(cleared.profilePictureKey).toBeNull();
        });
    });

    describe("deleteStudent", () => {
        test("deletes student", async () => {
            await repo.deleteStudent(testStudentID);

            await expect(
                repo.getStudentByID(testStudentID)
            ).rejects.toThrow(Error);
        });
    });
});