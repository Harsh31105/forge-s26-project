import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { SampleRepositorySchema } from "../samples";
import { sample } from "../../../tables/sample";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {NotFoundError} from "../../../../errs/httpError";

describe("SampleRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: SampleRepositorySchema;
    let testSampleID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new SampleRepositorySchema(db);
    });

    beforeEach(async () => {
        await cleanupTestData();
        const id = uuid();
        await db.insert(sample).values({
            id,
            name: "Test Sample",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testSampleID = id;
    })

    afterAll(async () => {
        await shutdownSharedTestDB();
    });

    describe("getSamples", () => {
        test("empty and populated DB", async () => {
            await repo.deleteSample(testSampleID);

            let results = await repo.getSamples();
            expect(results).toEqual([]);

            await db.insert(sample).values({
                id: testSampleID,
                name: "Test Sample",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            results = await repo.getSamples();
            expect(results).toHaveLength(1);
            expect(results[0]!.id).toBe(testSampleID);
        });
    });

    describe("getSampleByID", () => {
        test("invalid ID first, valid ID next", async () => {
            const invalidId = uuid();
            await expect(repo.getSampleByID(invalidId)).rejects.toThrow(NotFoundError);

            const sample = await repo.getSampleByID(testSampleID);
            expect(sample.id).toBe(testSampleID);
        });
    });

    describe("createSample", () => {
        test("bad input first, good input next", async () => {
            await expect(repo.createSample({} as any)).rejects.toThrow();

            const newSample = await repo.createSample({ name: "Created Sample" });
            expect(newSample.name).toBe("Created Sample");
        });
    });

    describe("patchSample", () => {
        test("non-existent ID first, valid update next", async () => {
            const invalidId = uuid();
            await expect(repo.patchSample(invalidId, { name: "Fail" })).rejects.toThrow();

            const updated = await repo.patchSample(testSampleID, { name: "Updated Sample" });
            expect(updated.name).toBe("Updated Sample");
        });
    });

    describe("deleteSample", () => {
        test("invalid ID first, valid deletion next", async () => {
            await expect(repo.deleteSample(testSampleID)).resolves.not.toThrow();

            await expect(repo.getSampleByID(testSampleID)).rejects.toThrow(NotFoundError);
        });
    });
});
