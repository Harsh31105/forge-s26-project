import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../models/sample";
import type {Review, ReviewPatchInputType, ReviewPostInputType} from "../models/review";
import {SampleRepositorySchema} from "./postgres/schema/samples";
import {ReviewRepositorySchema} from "./postgres/schema/reviews";

export class Repository {
    public readonly samples: SampleRepository;
    public readonly reviews: ReviewRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.reviews = new ReviewRepositorySchema(db);
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

export interface ReviewRepository {
    getReviews(): Promise<Review[]>;
    getReviewByID(id: string): Promise<Review>;
    createReview(input: ReviewPostInputType): Promise<Review>;
    patchReview(id: string, input: ReviewPatchInputType): Promise<Review>;
    deleteReview(id: string): Promise<void>;
}