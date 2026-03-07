import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import type {Course, CoursePatchInputType, CoursePostInputType} from "../models/course";
import { CourseRepositorySchema } from "./postgres/schema/course";

import type { CourseThread, CourseThreadPatchInputType, CourseThreadPostInputType } from "../models/courseThread";
import { CourseThreadRepositorySchema } from "./postgres/schema/courseThreads";
import { PaginationType } from "utils/pagination";
import { SampleRepositorySchema } from "./postgres/schema/samples";
import type { Professor, ProfessorPatchInputType, ProfessorPostInputType } from "../models/professor";
import { ProfessorRepositorySchema } from "./postgres/schema/professor";
import type { TraceDocumentRepository } from "./s3/traceDocuments";
import { TraceDocumentRepositoryS3 } from "./s3/traceDocuments";
import type { S3 as S3Config } from "../config/s3";

import type { ProfThread, ProfessorThreadPostInputType, ProfessorThreadPatchInputType } from "../models/profThreads";
import { ProfThreadRepositorySchema } from "./postgres/schema/profThread";
//import { PaginationType } from "utils/pagination";

export class Repository {
    public readonly samples: SampleRepository;
    public readonly professors: ProfessorRepository;
    public readonly courses: CourseRepository;
    public readonly courseThreads: CourseThreadRepository;
    public readonly traceDocuments: TraceDocumentRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase, s3Config: S3Config) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.courses = new CourseRepositorySchema(db);
        this.courseThreads = new CourseThreadRepositorySchema(db);
        this.professors = new ProfessorRepositorySchema(db);
        this.traceDocuments = new TraceDocumentRepositoryS3(s3Config);
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

export interface CourseThreadRepository {
    getThreadsByCourseReviewId(courseReviewId: string, pagination: PaginationType): Promise<CourseThread[]>;
    createThread(courseReviewId: string, input: CourseThreadPostInputType): Promise<CourseThread>;
    patchThread(threadId: string, input: CourseThreadPatchInputType): Promise<CourseThread>;
    deleteThread(threadId: string): Promise<void>;
}
export interface ProfThreadRepository {
    getThreadsByProfReviewId(profReviewId: string, pagination: PaginationType): Promise<ProfThread[]>; //will work after nishas 
    createThread(profReviewId: string, input: ProfessorThreadPostInputType): Promise<ProfThread>;
    patchThread(threadId: string, input: ProfessorThreadPatchInputType): Promise<ProfThread>;
    deleteThread(threadId: string): Promise<void>;
}

export interface ProfessorRepository {
    getProfessors(pagination: PaginationType): Promise<Professor[]>;
    getProfessorByID(id: string): Promise<Professor>;
    createProfessor(input: ProfessorPostInputType): Promise<Professor>;
    patchProfessor(id: string, input: ProfessorPatchInputType): Promise<Professor>;
    deleteProfessor(id: string): Promise<void>;
}