import {
    cleanupTestData,
    setupTestWithCleanup,
    shutdownSharedTestDB
} from "../../testutil/shared_db";
import { CourseRepositorySchema } from "../course";
import { course } from "../../../tables/course";
import { v4 as uuid } from "uuid";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {NotFoundError} from "../../../../errs/httpError";
import { newPagination} from "../../../../utils/pagination";
import { department } from "../../../tables/department";

describe("CourseRepositorySchema DB Integration", () => {
    let db!: NodePgDatabase;
    let repo!: CourseRepositorySchema;
    let testCourseID: string;
    let testDepartmentID: number;

    beforeAll(async () => {
        db = await setupTestWithCleanup();
        repo = new CourseRepositorySchema(db);
    }, 30000);

    beforeEach(async () => {
        await cleanupTestData();

        const dept = await db.insert(department).values({
            name: "CS"
        }).returning();
        if (!dept[0]) {
            throw new Error("Failed to create department");
        }
        testDepartmentID = dept[0].id;


        const id = uuid();
        await db.insert(course).values({
            id,
            name: "Algorithms & Data Structures",
            departmentId: testDepartmentID,
            courseCode: 3000,
            description: "An introductory course on algorithms and data structures.",
            numCredits: 4,
            lectureType: "lecture",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        testCourseID = id;
    })

    afterAll(async () => {
        await shutdownSharedTestDB();
    }, 30000);

    describe("getCourses", () => {
        test("empty and populated DB", async () => {
            await repo.deleteCourse(testCourseID);

            const pagination = newPagination();
            let results = await repo.getCourses(pagination);
            expect(results).toEqual([]);

            await db.insert(course).values({
                id: testCourseID,
                name: "Algorithms & Data Structures",
                departmentId: testDepartmentID,
                courseCode: 3000,
                description: "An introductory course on algorithms and data structures.",   
                numCredits: 4,
                lectureType: "lecture",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            results = await repo.getCourses(pagination);
            expect(results).toHaveLength(1);
            expect(results[0]!.id).toBe(testCourseID);
            expect(results[0]!.name).toBe("Algorithms & Data Structures");
            expect(results[0]!.course_code).toBe(3000);
            expect(results[0]!.description).toBe("An introductory course on algorithms and data structures.");
            expect(results[0]!.num_credits).toBe(4);
            expect(results[0]!.lecture_type).toBe("lecture");
            expect(results[0]!.department.name).toBe("CS");
            expect(results[0]!.department.id).toBe(testDepartmentID);
        });

        test("pagination works", async () => {
            // insert additional courses
            await db.insert(course).values({
                id: uuid(),
                name: "Computer Systems",
                departmentId: testDepartmentID,
                courseCode: 3650, 
                description: "An introduction to computer systems and architecture.",
                numCredits: 4,
                lectureType: "online",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            await db.insert(course).values({
                id: uuid(),
                name: "Object Oriented Design Lab",
                departmentId: testDepartmentID,
                courseCode: 3501,
                description: "Lab for a course on object-oriented design principles and patterns.",
                numCredits: 1,
                lectureType: "lab",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // 3 total courses now, test pagination with limit 2
            const page1 = await repo.getCourses({ page: 1, limit: 2 });
            expect(page1).toHaveLength(2);

            const page2 = await repo.getCourses({ page: 2, limit: 2 });
            expect(page2).toHaveLength(1);

            const page3 = await repo.getCourses({ page: 3, limit: 2 });
            expect(page3).toHaveLength(0);
                
        });

    });


    describe("getCourseByID", () => {
        test("invalid ID first, valid ID next", async () => {
            const invalidId = uuid();
            await expect(repo.getCourseByID(invalidId)).rejects.toThrow(NotFoundError);

            const courseTest = await repo.getCourseByID(testCourseID);
            expect(courseTest.id).toBe(testCourseID);
            expect(courseTest.name).toBe("Algorithms & Data Structures");
            expect(courseTest.course_code).toBe(3000);
            expect(courseTest.description).toBe("An introductory course on algorithms and data structures.");
            expect(courseTest.num_credits).toBe(4);
            expect(courseTest.lecture_type).toBe("lecture");
            expect(courseTest.department.name).toBe("CS");
            expect(courseTest.department.id).toBe(testDepartmentID);
        });
    });

    describe("createCourse", () => {
        test("bad input first, good input next", async () => {
            await expect(repo.createCourse({} as any)).rejects.toThrow();

            const newCourse = await repo.createCourse({ 
                name: "Theory of Computation",
                department_id: testDepartmentID,
                course_code: 3800,
                description: "A course on the theory of computation.",
                num_credits: 4,
                lecture_type: "lecture"
            });
            expect(newCourse.name).toBe("Theory of Computation");
            expect(newCourse.course_code).toBe(3800);
            expect(newCourse.description).toBe("A course on the theory of computation.");
            expect(newCourse.num_credits).toBe(4);
            expect(newCourse.lecture_type).toBe("lecture");
            expect(newCourse.department.name).toBe("CS");
            expect(newCourse.department.id).toBe(testDepartmentID);
        });
    });

    describe("patchCourse", () => {
        test("non-existent ID first, valid update next", async () => {
            const invalidId = uuid();
            await expect(repo.patchCourse(invalidId, { name: "Fail" })).rejects.toThrow();

            const updated = await repo.patchCourse(testCourseID,
                 { name: "Program & Design Implementation",
                   course_code: 3100,
                  });
            expect(updated.name).toBe("Program & Design Implementation");
            expect(updated.course_code).toBe(3100);
            expect(updated.description).toBe("An introductory course on algorithms and data structures.");
            expect(updated.num_credits).toBe(4);
            expect(updated.lecture_type).toBe("lecture");
            expect(updated.department.name).toBe("CS");
            expect(updated.department.id).toBe(testDepartmentID);
        });
    });

    describe("deleteCourse", () => {
        test("invalid ID first, valid deletion next", async () => {
            await expect(repo.deleteCourse(testCourseID)).resolves.not.toThrow();

            await expect(repo.getCourseByID(testCourseID)).rejects.toThrow(NotFoundError);
        });
    });
});
