"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedTestDB = getSharedTestDB;
exports.cleanupTestData = cleanupTestData;
exports.shutdownSharedTestDB = shutdownSharedTestDB;
exports.setupTestWithCleanup = setupTestWithCleanup;
const testcontainers_1 = require("testcontainers");
const pg_1 = require("pg");
const postgres_js_1 = require("drizzle-orm/postgres-js");
let sharedTestDB = null;
async function getSharedTestDB() {
    if (sharedTestDB)
        return sharedTestDB.db;
    const container = await new testcontainers_1.GenericContainer("postgres:15-alpine")
        .withExposedPorts(5432)
        .withEnvironment({
        POSTGRES_DB: "testdb",
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
        POSTGRES_INITDB_ARGS: "-E UTF8 --auth-local=trust",
        POSTGRES_HOST_AUTH_METHOD: "trust",
    })
        .start();
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    const pool = new pg_1.Pool({
        host,
        port,
        user: "test",
        password: "test",
        database: "testdb",
        max: 50,
    });
    const db = (0, postgres_js_1.drizzle)(pool);
    sharedTestDB = { pool, db, container };
    await applyTestOptimizations(pool);
    await createAllTables(db);
    return db;
}
async function applyTestOptimizations(pool) {
    const optimizations = [
        "ALTER SYSTEM SET fsync = off",
        "ALTER SYSTEM SET synchronous_commit = off",
        "ALTER SYSTEM SET full_page_writes = off",
        "ALTER SYSTEM SET checkpoint_segments = 100",
        "ALTER SYSTEM SET checkpoint_completion_target = 0.9",
        "ALTER SYSTEM SET wal_buffers = '64MB'",
        "ALTER SYSTEM SET shared_buffers = '256MB'",
        "SELECT pg_reload_conf()",
    ];
    for (const sql of optimizations) {
        try {
            await pool.query(sql);
        }
        catch (err) {
            console.warn(`Failed to apply optimization "${sql}":`, err);
        }
    }
}
async function createAllTables(db) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sample (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
async function cleanupTestData() {
    if (!sharedTestDB)
        return;
    const { db } = sharedTestDB;
    await db.execute(`
    TRUNCATE TABLE 
      sample
    RESTART IDENTITY CASCADE;
  `);
}
async function shutdownSharedTestDB() {
    if (!sharedTestDB)
        return;
    await sharedTestDB.pool.end();
    await sharedTestDB.container.stop();
    sharedTestDB = null;
}
async function setupTestWithCleanup() {
    const db = await getSharedTestDB();
    await cleanupTestData();
    return db;
}
//# sourceMappingURL=shared_db.js.map