// professor.test.ts -- 

// db integration test, uses database via docker
// tests that queries actually work correctly against 
// a Postgres instance

import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { ProfessorRepositorySchema } from "../professor";
import { professor } from "../../../tables/professor";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { NotFoundError } from "../../../../errs/httpError";

describe("ProfessorRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: ProfessorRepositorySchema;
    let testProfessorID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new ProfessorRepositorySchema(db);
    });

    beforeEach(async () => {
        await cleanupTestData();
        const id = uuid();
        await db.insert(professor).values({
            id,
            firstName: "John",
            lastName: "Doe",
            tags: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testProfessorID = id;
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    });

    describe("getProfessors", () => {
        test("empty and populated DB", async () => {
            await repo.deleteProfessor(testProfessorID);

            let results = await repo.getProfessors();
            expect(results).toEqual([]);

            await db.insert(professor).values({
                id: testProfessorID,
                firstName: "John",
                lastName: "Doe",
                tags: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            results = await repo.getProfessors();
            expect(results).toHaveLength(1);
            expect(results[0]!.id).toBe(testProfessorID);
        });
    });

    describe("getProfessorByID", () => {
        test("invalid ID first, valid ID next", async () => {
            const invalidId = uuid();
            await expect(repo.getProfessorByID(invalidId)).rejects.toThrow(NotFoundError);

            const result = await repo.getProfessorByID(testProfessorID);
            expect(result.id).toBe(testProfessorID);
        });
    });

    describe("createProfessor", () => {
        test("bad input first, good input next", async () => {
            await expect(repo.createProfessor({} as any)).rejects.toThrow();

            const newProfessor = await repo.createProfessor({ firstName: "Jane", lastName: "Smith" });
            expect(newProfessor.firstName).toBe("Jane");
            expect(newProfessor.lastName).toBe("Smith");
        });
    });

    describe("patchProfessor", () => {
        test("non-existent ID first, valid update next", async () => {
            const invalidId = uuid();
            await expect(repo.patchProfessor(invalidId, { firstName: "Fail" })).rejects.toThrow(NotFoundError);

            const updated = await repo.patchProfessor(testProfessorID, { firstName: "Updated" });
            expect(updated.firstName).toBe("Updated");
        });
    });

    describe("deleteProfessor", () => {
        test("invalid ID first, valid deletion next", async () => {
            await expect(repo.deleteProfessor(testProfessorID)).resolves.not.toThrow();

            await expect(repo.getProfessorByID(testProfessorID)).rejects.toThrow(NotFoundError);
        });
    });
});

