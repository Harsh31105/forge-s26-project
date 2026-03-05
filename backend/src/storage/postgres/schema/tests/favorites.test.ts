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

describe("FavoriteRepositorySchema DB Integration", () => {
    jest.setTimeout(60_000);
    let db!: NodePgDatabase;
    let repo!: FavoritesRepositorySchema;
    let testFavoriteID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new FavoritesRepositorySchema(db);
    });

    beforeEach(async () => {
        await cleanupTestData();
        const id = uuid();
        await db.insert(favorite).values({
            id,
            name: "Test Favorite",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testFavoriteID = id;
    })

    afterAll(async () => {
        await shutdownSharedTestDB();
    });

    describe("getFavorites", () => {
        test("empty and populated DB", async () => {
            await repo.deleteFavorite(testFavoriteID);

            let results = await repo.getFavorites({limit:10, offset: 0});
            expect(results.items).toEqual([]);
            expect(results.total).toBe(0);
            expect(results.limit).toBe(10);
            expect(results.offset).toBe(0);

            await db.insert(favorite).values({
                id: testFavoriteID,
                name: "Test Favorite",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            results = await repo.getFavorites({limit: 34, offset: 0});
            expect(results.items).toHaveLength(1);
            expect(results.items[0]!.id).toBe(testFavoriteID);
            expect(results.total).toBe(1);
        });

        test("paginates with limit/offset", async () => {

            const id2 = uuid();
            await db.insert(favorite).values({
                id: id2, 
                name: "second favorite",
                createdAt: new Date(), 
                updatedAt: new Date(),
            });

            const page1 = await repo.getFavorites({limit: 1, offset: 0});
            expect(page1.items).toHaveLength(1);
            expect(page1.total).toBe(2);

            const page2 = await repo.getFavorites({limit: 1, offset: 1});
            expect(page2.items).toHaveLength(1);
            expect(page2.total).toBe(2);

            expect(page1.items[0]!.id).not.toBe(page2.items[0]!.id);
        });
    });


    
    describe("createFavorite", () => {
        test("bad input first, good input next", async () => {
            await expect(repo.createFavorite({} as any)).rejects.toThrow();

            const newSample = await repo.createFavorite({ name: "Created Sample" });
            expect(newSample.name).toBe("Created Sample");
        });
    });


    describe("deleteFavorite", () => {
        test("invalid ID first, valid deletion next", async () => {
            const invalidID = uuid();
            await expect(repo.deleteFavorite(invalidID)).rejects.toThrow(NotFoundError);
            await expect(repo.deleteFavorite(testFavoriteID)).resolves.not.toThrow();

        });
    });
});
