import { GenericContainer, StartedTestContainer } from "testcontainers";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";

let sharedTestDB: {
    pool: Pool;
    db: NodePgDatabase;
    container: StartedTestContainer;
} | null = null;

export async function getSharedTestDB(): Promise<NodePgDatabase> {
    if (sharedTestDB) return sharedTestDB.db;

    const container = await new GenericContainer("postgres:15-alpine")
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

    const pool = new Pool({
        host,
        port,
        user: "test",
        password: "test",
        database: "testdb",
        max: 50,
    });

    const db = drizzle(pool);

    sharedTestDB = { pool, db, container };

    await applyTestOptimizations(pool);
    await createAllTables(db);

    return db;
}

async function applyTestOptimizations(pool: Pool) {
    const optimizations = [
        "ALTER SYSTEM SET fsync = off",
        "ALTER SYSTEM SET synchronous_commit = off",
        "ALTER SYSTEM SET full_page_writes = off",
        "ALTER SYSTEM SET max_wal_size = '1GB'",
        "ALTER SYSTEM SET checkpoint_completion_target = 0.9",
        "ALTER SYSTEM SET wal_buffers = '64MB'",
        "ALTER SYSTEM SET shared_buffers = '256MB'",
        "SELECT pg_reload_conf()",
    ];

    for (const sql of optimizations) {
        try {
            await pool.query(sql);
        } catch (err) {
            console.warn(`Failed to apply optimization "${sql}":`, err);
        }
    }
}

async function createAllTables(db: NodePgDatabase) {
    await db.execute(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";        

        CREATE TABLE IF NOT EXISTS sample (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
        CREATE TABLE IF NOT EXISTS department (
        id SERIAL PRIMARY KEY,
        name VARCHAR(10) NOT NULL UNIQUE
    );

        CREATE TYPE lecture_type_enum AS ENUM ('lecture', 'lab', 'online');

        CREATE TABLE IF NOT EXISTS course (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        department_id INTEGER NOT NULL REFERENCES department(id) ON DELETE CASCADE,
        course_code INTEGER NOT NULL CHECK (course_code >= '1000' AND course_code < '10000'),
        description VARCHAR(1000) NOT NULL,
        num_credits INTEGER NOT NULL CHECK (num_credits >= 1 AND num_credits <= 6),
        lecture_type lecture_type_enum,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
        
    `);
}

export async function cleanupTestData() {
    if (!sharedTestDB) return;

    const { db } = sharedTestDB;

    await db.execute(`
    TRUNCATE TABLE 
      course,
      department,
      sample
    RESTART IDENTITY CASCADE;
  `);
}

export async function shutdownSharedTestDB() {
    if (!sharedTestDB) return;

    await sharedTestDB.pool.end();
    await sharedTestDB.container.stop();
    sharedTestDB = null;
}

export async function setupTestWithCleanup() {
    const db = await getSharedTestDB();
    await cleanupTestData();
    return db;
}