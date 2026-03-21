import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TraceRepositorySchema } from "../trace";
import { trace } from "../../../tables/trace";
import {TracePostInputSchema} from "../../../../models/trace";

describe("TraceRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: TraceRepositorySchema;
    let testTraceID!: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new TraceRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const [row] = await db.insert(trace).values({
            action: "created review",
            timestamp: new Date("2026-03-20T19:00:00.000Z"),
        }).returning();

        if (!row) throw new Error("Failed to create test trace");
        testTraceID = row.id;
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    test("getTraceByID returns trace", async () => {
        const fetched = await repo.getTraceByID(testTraceID);

        expect(fetched.id).toBe(testTraceID);
        expect(fetched.action).toBe("created review");
    });

    test("getTraceByID throws if not found", async () => {
        const fakeID = "00000000-0000-0000-0000-000000000000";

        await expect(repo.getTraceByID(fakeID)).rejects.toThrow();
    });

    test("createTrace inserts trace", async () => {
        const created = await repo.createTrace({
            action: "new trace",
            timestamp: new Date("2026-03-20T19:00")
        });

        expect(created).toBeDefined();
        expect(created.id).toBeDefined();
        expect(created.action).toBe("new trace");
    });

    test("createTrace rejects invalid input at schema level", () => {
        const result = TracePostInputSchema.safeParse({
            action: "",
            timestamp: new Date()
        });

        expect(result.success).toBe(false);
    });

    test("getTraces returns paginated results", async () => {
        for (let i = 0; i < 15; i++) {
            await db.insert(trace).values({
                action: `trace-${i}`,
                timestamp: new Date()
            });
        }

        const page1 = await repo.getTraces({ page: 1, limit: 10 });
        const page2 = await repo.getTraces({ page: 2, limit: 10 });

        expect(page1.length).toBe(10);
        expect(page2.length).toBeGreaterThan(0);
        expect(page1[0]).toBeDefined();
        expect(page2[0]).toBeDefined();
        expect(page1[0]!.id).not.toBe(page2[0]!.id);
    });

    test("getTraces returns empty array for out-of-range page", async () => {
        const result = await repo.getTraces({ page: 100, limit: 10 });
        expect(result).toEqual([]);
    });

    test("deleteTrace removes trace", async () => {
        await repo.deleteTrace(testTraceID);

        await expect(repo.getTraceByID(testTraceID)).rejects.toThrow();
    });
});