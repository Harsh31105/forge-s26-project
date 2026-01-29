import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample} from "../models/sample";
import {SampleRepositorySchema} from "./postgres/schema/samples";

export class Repository {
    public readonly sample: SampleRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.sample = new SampleRepositorySchema(db);
    }

    getDB(): NodePgDatabase {
        return this.db;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export interface SampleRepository {
    getSample(): Promise<Sample[]>
}