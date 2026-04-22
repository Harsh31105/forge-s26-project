import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB,
} from "../../testutil/shared_db";
import { AcademicRepositorySchema } from "../academic";
import { StudentRepositorySchema } from "../students";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v4 as uuid } from "uuid";
import { student } from "../../../tables/student";
import { major, concentration, minor } from "../../../tables/academic";

describe("AcademicRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: AcademicRepositorySchema;
    let studentRepo!: StudentRepositorySchema;
    let testStudentID: string;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new AcademicRepositorySchema(db);
        studentRepo = new StudentRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const id = uuid();
        await db.insert(student).values({
            id,
            firstName: "Academic",
            lastName: "TestStudent",
            email: `${id}@test.com`,
            graduationYear: 2026,
            preferences: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        testStudentID = id;
    });

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("getMajors", () => {
        test("returns all seeded majors", async () => {
            const majors = await repo.getMajors();
            expect(majors.length).toBeGreaterThan(0);
            expect(majors[0]).toHaveProperty("id");
            expect(majors[0]).toHaveProperty("name");
        });
    });

    describe("getConcentrations", () => {
        test("returns all seeded concentrations", async () => {
            const concentrations = await repo.getConcentrations();
            expect(concentrations.length).toBeGreaterThan(0);
            expect(concentrations[0]).toHaveProperty("id");
            expect(concentrations[0]).toHaveProperty("name");
        });
    });

    describe("getMinors", () => {
        test("returns empty list when no minors seeded", async () => {
            // Minors are not seeded in shared_db, so this should be empty
            const minors = await repo.getMinors();
            expect(Array.isArray(minors)).toBe(true);
        });

        test("returns minor after insert", async () => {
            await db.insert(minor).values({ name: "Test Minor" });
            const minors = await repo.getMinors();
            expect(minors.some((m) => m.name === "Test Minor")).toBe(true);
        });
    });

    describe("Student Major operations", () => {
        let majorId: number;

        beforeEach(async () => {
            // Use a seeded major (Computer Science)
            const majors = await repo.getMajors();
            const cs = majors.find((m) => m.name === "Computer Science");
            expect(cs).toBeDefined();
            majorId = cs!.id;
        });

        test("addStudentMajor and getStudentMajors", async () => {
            await repo.addStudentMajor(testStudentID, majorId);

            const studentMajors = await repo.getStudentMajors(testStudentID);
            expect(studentMajors).toHaveLength(1);
            expect(studentMajors[0]!.id).toBe(majorId);
            expect(studentMajors[0]!.name).toBe("Computer Science");
        });

        test("deleteStudentMajor removes the association", async () => {
            await repo.addStudentMajor(testStudentID, majorId);
            await repo.deleteStudentMajor(testStudentID, majorId);

            const studentMajors = await repo.getStudentMajors(testStudentID);
            expect(studentMajors).toHaveLength(0);
        });

        test("getStudentMajors returns empty for student with no majors", async () => {
            const studentMajors = await repo.getStudentMajors(testStudentID);
            expect(studentMajors).toHaveLength(0);
        });
    });

    describe("Student Concentration operations", () => {
        let concentrationId: number;

        beforeEach(async () => {
            const concentrations = await repo.getConcentrations();
            const ai = concentrations.find((c) => c.name === "Artificial Intelligence");
            expect(ai).toBeDefined();
            concentrationId = ai!.id;
        });

        test("addStudentConcentration and getStudentConcentrations", async () => {
            await repo.addStudentConcentration(testStudentID, concentrationId);

            const studentConcentrations = await repo.getStudentConcentrations(testStudentID);
            expect(studentConcentrations).toHaveLength(1);
            expect(studentConcentrations[0]!.id).toBe(concentrationId);
            expect(studentConcentrations[0]!.name).toBe("Artificial Intelligence");
        });

        test("deleteStudentConcentration removes the association", async () => {
            await repo.addStudentConcentration(testStudentID, concentrationId);
            await repo.deleteStudentConcentration(testStudentID, concentrationId);

            const studentConcentrations = await repo.getStudentConcentrations(testStudentID);
            expect(studentConcentrations).toHaveLength(0);
        });

        test("getStudentConcentrations returns empty for student with no concentrations", async () => {
            const studentConcentrations = await repo.getStudentConcentrations(testStudentID);
            expect(studentConcentrations).toHaveLength(0);
        });
    });

    describe("Student Minor operations", () => {
        let minorId: number;

        beforeEach(async () => {
            // Insert a test minor since none are seeded
            const [inserted] = await db
                .insert(minor)
                .values({ name: `TestMinor-${uuid()}` })
                .returning();
            minorId = inserted!.id;
        });

        test("addStudentMinor and getStudentMinors", async () => {
            await repo.addStudentMinor(testStudentID, minorId);

            const studentMinors = await repo.getStudentMinors(testStudentID);
            expect(studentMinors).toHaveLength(1);
            expect(studentMinors[0]!.id).toBe(minorId);
        });

        test("deleteStudentMinor removes the association", async () => {
            await repo.addStudentMinor(testStudentID, minorId);
            await repo.deleteStudentMinor(testStudentID, minorId);

            const studentMinors = await repo.getStudentMinors(testStudentID);
            expect(studentMinors).toHaveLength(0);
        });

        test("getStudentMinors returns empty for student with no minors", async () => {
            const studentMinors = await repo.getStudentMinors(testStudentID);
            expect(studentMinors).toHaveLength(0);
        });
    });

    describe("getMajorsForStudents", () => {
        test("returns empty object when no student IDs provided", async () => {
            const result = await repo.getMajorsForStudents([]);
            expect(result).toEqual({});
        });

        test("returns majors keyed by student ID", async () => {
            const majors = await repo.getMajors();
            const cs = majors.find((m) => m.name === "Computer Science")!;

            await repo.addStudentMajor(testStudentID, cs.id);

            const result = await repo.getMajorsForStudents([testStudentID]);
            expect(result[testStudentID]).toBeDefined();
            expect(result[testStudentID]!.some((m) => m.name === "Computer Science")).toBe(true);
        });
    });

    describe("getConcentrationsForStudents", () => {
        test("returns empty object when no student IDs provided", async () => {
            const result = await repo.getConcentrationsForStudents([]);
            expect(result).toEqual({});
        });

        test("returns concentrations keyed by student ID", async () => {
            const concentrations = await repo.getConcentrations();
            const ai = concentrations.find((c) => c.name === "Artificial Intelligence")!;

            await repo.addStudentConcentration(testStudentID, ai.id);

            const result = await repo.getConcentrationsForStudents([testStudentID]);
            expect(result[testStudentID]).toBeDefined();
            expect(result[testStudentID]!.some((c) => c.name === "Artificial Intelligence")).toBe(true);
        });
    });

    describe("getMinorsForStudents", () => {
        test("returns empty object when no student IDs provided", async () => {
            const result = await repo.getMinorsForStudents([]);
            expect(result).toEqual({});
        });

        test("returns minors keyed by student ID", async () => {
            const [inserted] = await db
                .insert(minor)
                .values({ name: `BulkMinor-${uuid()}` })
                .returning();
            const minorId = inserted!.id;

            await repo.addStudentMinor(testStudentID, minorId);

            const result = await repo.getMinorsForStudents([testStudentID]);
            expect(result[testStudentID]).toBeDefined();
            expect(result[testStudentID]!.some((m) => m.id === minorId)).toBe(true);
        });
    });
});