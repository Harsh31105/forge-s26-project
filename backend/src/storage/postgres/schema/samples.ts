import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../../../models/sample";
import {SampleRepository} from "../../storage";
import {sample} from "../../tables/sample";
import { eq } from "drizzle-orm";
import {NotFoundError} from "../../../errs/httpError";
import { PaginationType, getOffset} from "utils/pagination";

export class SampleRepositorySchema implements SampleRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getSamples(pagination: PaginationType): Promise<Sample[]> {
        return this.db.select().from(sample).limit(pagination.limit).offset(getOffset(pagination));
    }

    async getSampleByID(id: string): Promise<Sample> {
        const [row] = await this.db.select().from(sample).where(eq(sample.id, id));
        if (!row) throw new NotFoundError("sample with given ID not found");

        return row
    }

    async createSample(input: SamplePostInputType): Promise<Sample> {
        const [row] = await this.db.insert(sample).values({
            name: input.name,
        }).returning();
        if (!row) throw Error();

        return row;
    }

    async patchSample(id: string, input: SamplePatchInputType): Promise<Sample> {
        const [row] = await this.db.update(sample).set({ ...input }).where(eq(sample.id, id)).returning();
        if (!row) throw new Error();

        return row;
    }

    async deleteSample(id: string): Promise<void> {
        await this.db.delete(sample).where(eq(sample.id, id))
    }
}