import { Pool } from "pg";

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