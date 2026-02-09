import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import {SampleRepositorySchema} from "./postgres/schema/samples";
import type {
    CourseReview,
    CourseReviewPatchInputType,
    CourseReviewPostInputType,
  } from "../models/courseReview";
import { CourseReviewRepositorySchema } from "./postgres/schema/courseReviews";


export class Repository {
    public readonly samples: SampleRepository;
    public readonly courseReviews: CourseReviewRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.courseReviews = new CourseReviewRepositorySchema(db);
    }

    async getDB(): Promise<NodePgDatabase> {
        return this.db;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export interface SampleRepository {
    getSamples(): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}

export interface CourseReviewRepository {
    getCourseReviews(): Promise<CourseReview[]>;
    getCourseReviewByID(id: string): Promise<CourseReview>;
    createCourseReview(input: CourseReviewPostInputType): Promise<CourseReview>;
    patchCourseReview(id: string, input: CourseReviewPatchInputType): Promise<CourseReview>;
    deleteCourseReview(id: string): Promise<void>;
  }