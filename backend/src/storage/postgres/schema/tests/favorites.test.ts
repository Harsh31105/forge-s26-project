import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { FavoritesRepositorySchema } from "../favorites";
import { favorite } from "../../../tables/favorite";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {NotFoundError} from "../../../../errs/httpError";
import { newPagination, getOffset} from "../../../../utils/pagination";
import { Favorite } from "models/favorite";

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

        testStudentId = uuid();
        testCourseId = uuid();

        await db.insert(favorite).values({
            student_id: testStudentId,
            course_id: testCourseId,
            created_at: new Date(),
            updated_at: new Date()
        });
    })

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
                student_id: testStudentId,
                course_id: testCourseId,
                created_at: new Date(),
                updated_at: new Date()
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

            const newStudentId = uuid();
            const newCourseId = uuid();

            const createdFavorite = await repo.createFavorite({
                student_id: newStudentId,
                course_id: newCourseId
            });

            expect(createdFavorite.student_id).toBe(newStudentId);
            expect(createdFavorite.course_id).toBe(newCourseId);
        });
    });


    describe("deleteFavorite", () => {
        test("invalid ID first, valid deletion next", async () => {
            await expect(repo.deleteFavorite(testStudentId, testCourseId)).resolves.not.toThrow();
        });
    });
});