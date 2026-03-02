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
        CREATE TABLE IF NOT EXISTS sample (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TYPE lecture_type_enum AS ENUM (
            'lecture',
            'lab',
            'online'
        );

        CREATE TYPE requirement_type_enum AS ENUM (
          'prereq',
          'coreq'
        );
        
        CREATE TYPE location_tag_enum AS ENUM (
          'boston',
          'oakland',
          'london'
        );

        CREATE TYPE professor_tag_enum AS ENUM (
          'clear_lectures',
          'confusing_lectures',
          'organized',
          'disorganized',
          'engaging',
          'boring',
          'reads_slides',
          'fair_grading',
          'tough_grader',
          'lenient_grader',
          'unclear_rubrics',
          'curve_based',
          'no_curve',
          'tricky_exams',
          'straightforward_exams',
          'heavy_workload',
          'manageable_workload',
          'busywork',
          'high_expectations',
          'low_expectations',
          'approachable',
          'unapproachable',
          'responsive',
          'slow_responder',
          'caring',
          'intimidating',
          'passionate',
          'monotone',
          'attendance_required',
          'attendance_optional',
          'strict_deadlines',
          'flexible_deadlines',
          'extra_credit',
          'no_extra_credit',
          'little_to_no_test'
        );

        CREATE TYPE course_tag_enum AS ENUM (
          'easy_a',
          'challenging',
          'fast_paced',
          'slow_paced',
          'time_consuming',
          'exam_heavy',
          'project_heavy',
          'quiz_heavy',
          'participation_based',
          'presentation_heavy',
          'coding_heavy',
          'math_heavy',
          'reading_heavy',
          'writing_heavy',
          'group_projects',
          'solo_projects',
          'well_structured',
          'poorly_structured',
          'lecture_based',
          'discussion_based',
          'lab_required',
          'mandatory_attendance',
          'optional_attendance',
          'mandatory_textbook',
          'no_textbook'
        );

        CREATE TYPE pref_enum AS ENUM (
          'exam-heavy',
          'project-heavy',
          'group-work',
          'attendance-required',
          'strict_deadlines',
          'flexible_deadlines',
          'extra_credit',
          'little_to_no_test'
          'fast_paced',
          'slow_paced'
        );

        CREATE TABLE major (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );

        CREATE TABLE concentration (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );

        CREATE TABLE minor (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        );

        CREATE TABLE student (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            graduation_year INT CHECK ( graduation_year >= 2025 ),
            preferences pref_enum[],
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE student_major (
            student_id UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
            major_id INT NOT NULL REFERENCES major (id) ON DELETE CASCADE,
            PRIMARY KEY (student_id, major_id)
        );

        CREATE TABLE student_concentration (
            student_id UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
            concentration_id INT NOT NULL REFERENCES concentration (id) ON DELETE CASCADE,
            PRIMARY KEY (student_id, concentration_id)
        );

        CREATE TABLE student_minor (
            student_id UUID NOT NULL REFERENCES student (id) ON DELETE CASCADE,
            minor_id INT NOT NULL REFERENCES minor (id) ON DELETE CASCADE,
            PRIMARY KEY (student_id, minor_id)
        );

        CREATE TABLE department (
            id SERIAL PRIMARY KEY,
            name VARCHAR(10) NOT NULL UNIQUE
        );

        CREATE TABLE course (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            department_id INT NOT NULL,
            course_code INT NOT NULL CHECK ( course_code BETWEEN 1000 AND 10000),
            description VARCHAR(1000) NOT NULL,
            num_credits INT NOT NULL CHECK ( num_credits BETWEEN 1 AND 6),
            lecture_type lecture_type_enum,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE
        );

        CREATE TABLE professor (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            tags location_tag_enum[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE review (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
        );

        CREATE TABLE course_review (
            review_id UUID PRIMARY KEY,
            course_id UUID NOT NULL,
            rating INT NOT NULL CHECK ( rating BETWEEN 1 AND 5 ),
            review_text VARCHAR(2000) NOT NULL,
            tags course_tag_enum[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
        );

        CREATE TABLE professor_review (
            review_id UUID PRIMARY KEY,
            professor_id UUID NOT NULL,
            rating INT NOT NULL CHECK ( rating BETWEEN 1 AND 5 ),
            review_text VARCHAR(2000) NOT NULL,
            tags professor_tag_enum[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (review_id) REFERENCES review(id) ON DELETE CASCADE,
            FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
        );

        CREATE TABLE course_thread (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            course_review_id UUID NOT NULL,
            content VARCHAR(2000) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
            FOREIGN KEY (course_review_id) REFERENCES course_review(review_id) ON DELETE CASCADE
        );

        CREATE TABLE professor_thread (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            professor_review_id UUID NOT NULL,
            content VARCHAR(2000) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
            FOREIGN KEY (professor_review_id) REFERENCES professor_review(review_id) ON DELETE CASCADE
        );

        CREATE TABLE favorite (
            student_id UUID NOT NULL,
            course_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (student_id, course_id),
            FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
        );

        CREATE TYPE semester_enum AS ENUM (
            'fall',
            'spring',
            'summer_1',
            'summer_2'
        );

        CREATE TABLE degree_requirement (
            course_id UUID NOT NULL,
            major_id INT NOT NULL,
            required BOOLEAN NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (course_id, major_id),
            FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
            FOREIGN KEY (major_id) REFERENCES major(id) ON DELETE CASCADE
        );

        CREATE TABLE rmp (
            id SERIAL PRIMARY KEY,
            professor_id UUID NOT NULL,
            rating_avg DECIMAL(3, 2) CHECK (rating_avg >= 1 AND rating_avg <= 5),
            rating_wta INT CHECK (rating_wta BETWEEN 0 AND 100),
            avg_difficulty DECIMAL(3, 2) NOT NULL CHECK (avg_difficulty >= 1 AND avg_difficulty <= 5),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
        );

        CREATE TABLE trace (
            id SERIAL PRIMARY KEY,
            course_id UUID NOT NULL,
            professor_id UUID NOT NULL,
            course_name VARCHAR(255) NOT NULL,
            department_id INT NOT NULL,
            course_code INT NOT NULL CHECK (course_code BETWEEN 1000 AND 10000),
            semester semester_enum NOT NULL,
            lecture_year INT NOT NULL CHECK (lecture_year >= 2000 AND lecture_year <= 10000),
            lecture_type lecture_type_enum,
            how_often_percentage INT NOT NULL CHECK (how_often_percentage BETWEEN 0 AND 100),
            hours_devoted INT NOT NULL CHECK (hours_devoted >= 0),
            professor_efficiency DECIMAL(3,2) NOT NULL CHECK (professor_efficiency BETWEEN 1.00 AND 5.00),
            eval TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
            FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE
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
      course_thread,
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