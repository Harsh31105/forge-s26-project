import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import {SampleRepositorySchema} from "./postgres/schema/samples";

import type { CourseThread, CourseThreadPatchInputType, CourseThreadPostInputType } from "../models/courseThread";
import { CourseThreadRepositorySchema } from "./postgres/schema/courseThreads";
import { PaginationType } from "utils/pagination";

import type { ProfThread, ProfessorThreadPostInputType, ProfessorThreadPatchInputType } from "../models/profThreads";
import { ProfThreadRepositorySchema } from "./postgres/schema/profThread";
//import { PaginationType } from "utils/pagination";

export class Repository {
    public readonly samples: SampleRepository;
    public readonly courseThreads: CourseThreadRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.courseThreads = new CourseThreadRepositorySchema(db);
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


export interface CourseThreadRepository {
    getThreadsByCourseReviewId(courseReviewId: string, pagination: PaginationType): Promise<CourseThread[]>;
    createThread(courseReviewId: string, input: CourseThreadPostInputType): Promise<CourseThread>;
    patchThread(threadId: string, input: CourseThreadPatchInputType): Promise<CourseThread>;
}
export interface ProfThreadRepository {
    getThreadsByProfReviewId(profReviewId: string, pagination: PaginationType): Promise<ProfThread[]>; //will work after nishas 
    createThread(profReviewId: string, input: ProfessorThreadPostInputType): Promise<ProfThread>;
    patchThread(threadId: string, input: ProfessorThreadPatchInputType): Promise<ProfThread>;
    deleteThread(threadId: string): Promise<void>;
}
