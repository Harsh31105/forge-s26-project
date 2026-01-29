import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

export class Repository {
    public sample: SampleRepository;
    private readonly db: Pool;

    constructor(db :Pool) {
        this.db = db;
        this.sample = schema.SampleRepository(db);
    }

    getDB(): Pool {
        return this.db;
    }

    async close(): Promise<void> {
        await this.db.end();
    }
}

export interface SampleRepository {
    // TODO: Some Func.
}