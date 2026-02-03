import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
export declare function getSharedTestDB(): Promise<PostgresJsDatabase>;
export declare function cleanupTestData(): Promise<void>;
export declare function shutdownSharedTestDB(): Promise<void>;
export declare function setupTestWithCleanup(): Promise<PostgresJsDatabase<Record<string, never>>>;
//# sourceMappingURL=shared_db.d.ts.map