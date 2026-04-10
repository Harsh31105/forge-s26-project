import {type NodePgDatabase} from "drizzle-orm/node-postgres";
import type {
    Student,
    StudentPatchInputType,
    StudentPostInputType
} from "../../../models/student";
import {StudentRepository} from "../../storage";
import {eq} from "drizzle-orm";
import {student} from "../../tables/student";
import {type PaginationType, getOffset} from "../../../utils/pagination";

export class StudentRepositorySchema implements StudentRepository {
    constructor(private readonly db: NodePgDatabase) {
    }

    async getStudents(pagination: PaginationType): Promise<Student[]> {
        const offset = getOffset(pagination);
        return this.db
            .select()
            .from(student)
            .limit(pagination.limit)
            .offset(offset);
    }

    async getStudentByEmail(email: string): Promise<Student> {
        const [row] = await this.db.select().from(student).where(eq(student.email, email));
        if (!row) throw new Error("student not found");

        return row;
    }

    async getStudentByID(id: string): Promise<Student> {
        const [row] = await this.db
            .select()
            .from(student)
            .where(eq(student.id, id));

        if (!row) {
            throw new Error("Student not found");
        }
        return row;
    }

    async createStudent(
        input: StudentPostInputType
    ): Promise<Student> {
        const [row] = await this.db
            .insert(student)
            .values(input)
            .returning();

        if (!row) throw new Error("Failed to create student");
        return row;
    }

    async patchStudent(
        id: string,
        input: StudentPatchInputType
    ): Promise<Student> {

        const updates = Object.fromEntries(
            Object.entries(input).filter(([_, value]) => value !== undefined)
        );

        const [row] = await this.db
            .update(student)
            .set({...updates})
            .where(eq(student.id, id))
            .returning();

        if (!row) {
            throw new Error("Failed to update student");
        }
        return row;
    }

    async deleteStudent(id: string): Promise<void> {
        await this.db
            .delete(student)
            .where(eq(student.id, id))
    }
}