import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, inArray } from "drizzle-orm";
import type { Major, Minor, Concentration } from "../../../models/student";
import type { AcademicRepository } from "../../storage";
import {
    major,
    concentration,
    minor,
    studentMajor,
    studentConcentration,
    studentMinor,
} from "../../tables/academic";

export class AcademicRepositorySchema implements AcademicRepository {
    constructor(private readonly db: NodePgDatabase) {}

    async getMajors(): Promise<Major[]> {
        return this.db.select().from(major);
    }

    async getConcentrations(): Promise<Concentration[]> {
        return this.db.select().from(concentration);
    }

    async getMinors(): Promise<Minor[]> {
        return this.db.select().from(minor);
    }

    async getStudentMajors(studentId: string): Promise<Major[]> {
        const rows = await this.db
            .select({ id: major.id, name: major.name })
            .from(studentMajor)
            .innerJoin(major, eq(studentMajor.majorId, major.id))
            .where(eq(studentMajor.studentId, studentId));
        return rows;
    }

    async getStudentConcentrations(studentId: string): Promise<Concentration[]> {
        const rows = await this.db
            .select({ id: concentration.id, name: concentration.name })
            .from(studentConcentration)
            .innerJoin(concentration, eq(studentConcentration.concentrationId, concentration.id))
            .where(eq(studentConcentration.studentId, studentId));
        return rows;
    }

    async getStudentMinors(studentId: string): Promise<Minor[]> {
        const rows = await this.db
            .select({ id: minor.id, name: minor.name })
            .from(studentMinor)
            .innerJoin(minor, eq(studentMinor.minorId, minor.id))
            .where(eq(studentMinor.studentId, studentId));
        return rows;
    }

    async getMajorsForStudents(studentIds: string[]): Promise<Record<string, Major[]>> {
        if (studentIds.length === 0) return {};
        const rows = await this.db
            .select({ studentId: studentMajor.studentId, id: major.id, name: major.name })
            .from(studentMajor)
            .innerJoin(major, eq(studentMajor.majorId, major.id))
            .where(inArray(studentMajor.studentId, studentIds));

        const result: Record<string, Major[]> = {};
        for (const row of rows) {
            if (!result[row.studentId]) result[row.studentId] = [];
            result[row.studentId].push({ id: row.id, name: row.name });
        }
        return result;
    }

    async getConcentrationsForStudents(studentIds: string[]): Promise<Record<string, Concentration[]>> {
        if (studentIds.length === 0) return {};
        const rows = await this.db
            .select({ studentId: studentConcentration.studentId, id: concentration.id, name: concentration.name })
            .from(studentConcentration)
            .innerJoin(concentration, eq(studentConcentration.concentrationId, concentration.id))
            .where(inArray(studentConcentration.studentId, studentIds));

        const result: Record<string, Concentration[]> = {};
        for (const row of rows) {
            if (!result[row.studentId]) result[row.studentId] = [];
            result[row.studentId].push({ id: row.id, name: row.name });
        }
        return result;
    }

    async getMinorsForStudents(studentIds: string[]): Promise<Record<string, Minor[]>> {
        if (studentIds.length === 0) return {};
        const rows = await this.db
            .select({ studentId: studentMinor.studentId, id: minor.id, name: minor.name })
            .from(studentMinor)
            .innerJoin(minor, eq(studentMinor.minorId, minor.id))
            .where(inArray(studentMinor.studentId, studentIds));

        const result: Record<string, Minor[]> = {};
        for (const row of rows) {
            if (!result[row.studentId]) result[row.studentId] = [];
            result[row.studentId].push({ id: row.id, name: row.name });
        }
        return result;
    }

    async addStudentMajor(studentId: string, majorId: number): Promise<void> {
        await this.db.insert(studentMajor).values({ studentId, majorId });
    }

    async deleteStudentMajor(studentId: string, majorId: number): Promise<void> {
        await this.db
            .delete(studentMajor)
            .where(and(eq(studentMajor.studentId, studentId), eq(studentMajor.majorId, majorId)));
    }

    async addStudentConcentration(studentId: string, concentrationId: number): Promise<void> {
        await this.db.insert(studentConcentration).values({ studentId, concentrationId });
    }

    async deleteStudentConcentration(studentId: string, concentrationId: number): Promise<void> {
        await this.db
            .delete(studentConcentration)
            .where(and(eq(studentConcentration.studentId, studentId), eq(studentConcentration.concentrationId, concentrationId)));
    }

    async addStudentMinor(studentId: string, minorId: number): Promise<void> {
        await this.db.insert(studentMinor).values({ studentId, minorId });
    }

    async deleteStudentMinor(studentId: string, minorId: number): Promise<void> {
        await this.db
            .delete(studentMinor)
            .where(and(eq(studentMinor.studentId, studentId), eq(studentMinor.minorId, minorId)));
    }
}