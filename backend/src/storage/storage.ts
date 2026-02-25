import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import type {Course, CoursePatchInputType, CoursePostInputType} from "../models/course";

import { CourseRepositorySchema } from "./postgres/schema/course";
import {SampleRepositorySchema} from "./postgres/schema/samples";
import { PaginationType } from "utils/pagination";

export class Repository {
    public readonly samples: SampleRepository;
    public readonly courses: CourseRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.courses = new CourseRepositorySchema(db);
    }

    async getDB(): Promise<NodePgDatabase> {
        return this.db;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export interface SampleRepository {
    getSamples(pagination: PaginationType): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}

export interface CourseRepository {
    getCourses(pagination: PaginationType): Promise<Course[]>;
    getCourseByID(id: string): Promise<Course>;
    createCourse(input: CoursePostInputType): Promise<Course>;
    patchCourse(id: string, input: CoursePatchInputType): Promise<Course>;
    deleteCourse(id: string): Promise<void>;
}