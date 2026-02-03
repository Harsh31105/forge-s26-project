import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Sample, SamplePatchInputType, SamplePostInputType } from "../../../models/sample";
import { SampleRepository } from "../../storage";
export declare class SampleRepositorySchema implements SampleRepository {
    private readonly db;
    constructor(db: NodePgDatabase);
    getSamples(): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}
//# sourceMappingURL=samples.d.ts.map