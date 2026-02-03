import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Sample, SamplePatchInputType, SamplePostInputType } from "../models/sample";
export declare class Repository {
    readonly samples: SampleRepository;
    private readonly pool;
    private readonly db;
    constructor(pool: Pool, db: NodePgDatabase);
    getDB(): Promise<NodePgDatabase>;
    close(): Promise<void>;
}
export interface SampleRepository {
    getSamples(): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map