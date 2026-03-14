import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { ProfessorRepositorySchema } from "../professor";
import { rmp } from "../../../tables/rmp";
import { professor } from "../../../tables/professor";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { NotFoundError } from "../../../../errs/httpError";

describe("RMPRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: ProfessorRepositorySchema;
    let testProfessorID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new ProfessorRepositorySchema(db);
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

    describe("getRMPByProfessorID", () => {
        test("invalid professor ID first, valid ID next", async () => {
            const invalidId = uuid();
            await expect(repo.getRMPByProfessorID(invalidId)).rejects.toThrow(NotFoundError);

            // insert RMP data for the professor
            await db.insert(rmp).values({
                professorId: testProfessorID,
                ratingAvg: "4.50",
                ratingWta: 85,
                avgDifficulty: "3.20",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const result = await repo.getRMPByProfessorID(testProfessorID);
            expect(result.professorId).toBe(testProfessorID);
            expect(result.ratingAvg).toBe("4.50");
            expect(result.ratingWta).toBe(85);
            expect(result.avgDifficulty).toBe("3.20");
        });
    });

    describe("postRMP", () => {
    test("returns empty array when no professors have RMP data", async () => {
        const result = await repo.postRMP();
        // TODO: will test actual bulk insert once RMP API helper is implemented
        expect(result).toBeInstanceOf(Array);
    });
    });
});