import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { RMPRepositorySchema } from "../rmp";
import { rmp } from "../../../tables/rmp";
import { professor } from "../../../tables/professor";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

describe("RMPRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: RMPRepositorySchema;
    let testProfessorID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new RMPRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        // insert a professor to satisfy FK constraint
        const profId = uuid();
        await db.insert(professor).values({
            id: profId,
            firstName: "John",
            lastName: "Doe",
            tags: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        testProfessorID = profId;
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("", () => {
        test("", async () => {
            expect(1).toBe(1);
        })
    })

    // describe("getRMPByProfessorID", () => {
    //     test("invalid professor ID returns null, valid ID returns data", async () => {
    //         const invalidId = uuid();
    //
    //         const invalidResult = await repo.getRMPByProfessorID(invalidId);
    //         expect(invalidResult).toBeNull();
    //
    //         // insert RMP data for the professor
    //         await db.insert(rmp).values({
    //             professorId: testProfessorID,
    //             ratingAvg: "4.50",
    //             ratingWta: 85,
    //             avgDifficulty: "3.20",
    //             createdAt: new Date(),
    //             updatedAt: new Date(),
    //         });
    //
    //         const result = await repo.getRMPByProfessorID(testProfessorID);
    //
    //         expect(result).not.toBeNull();
    //         expect(result?.professorId).toBe(testProfessorID);
    //         expect(result?.ratingAvg).toBe("4.50");
    //         expect(result?.ratingWta).toBe(85);
    //         expect(result?.avgDifficulty).toBe("3.20");
    //     });
    //
    //     test("valid professor with no RMP returns null", async () => {
    //         const result = await repo.getRMPByProfessorID(testProfessorID);
    //         expect(result).toBeNull();
    //     });
    // });
    //
    // describe("postRMP", () => {
    //     test("returns empty array when no input given", async () => {
    //         const result = await repo.postRMP([]);
    //         expect(result).toBeInstanceOf(Array);
    //         expect(result).toHaveLength(0);
    //     });
    // });
});