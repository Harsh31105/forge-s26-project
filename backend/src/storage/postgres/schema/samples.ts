import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {Sample, SamplePatchInputType, SamplePostInputType} from "../../../models/sample";
import {SampleRepository} from "../../storage";
import {sample} from "../../tables/sample";
import { eq } from "drizzle-orm";
import {NotFoundError} from "../../../errs/httpError";

export class SampleRepositorySchema implements SampleRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getSamples(): Promise<Sample[]> {
        const rows = await this.db.select().from(sample);
        return rows.map(r => ({
            ...r,
            createdAt: r.createdAt!,
            updatedAt: r.updatedAt!,
        }));
    }

    async getSampleByID(id: string): Promise<Sample> {
        const [row] = await this.db.select().from(sample).where(eq(sample.id, id));

        if (!row) throw new NotFoundError("sample with given ID not found");

        return {
            ...row,
            id: row.id!,
            name: row.name!,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
        };
    }

    async createSample(input: SamplePostInputType): Promise<Sample> {
        const [row] = await this.db.insert(sample).values({
            name: input.name,
        }).returning();

        if (!row) throw new NotFoundError("sample with given ID not found");

        return {
            id: row.id!,
            name: row.name!,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
        };
    }

    async patchSample(id: string, input: SamplePatchInputType): Promise<Sample> {
        const [row] = await this.db.update(sample).set({ ...input }).where(eq(sample.id, id)).returning();

        if (!row) throw new NotFoundError("sample with given ID not found");

        return {
            ...row,
            id: row.id!,
            name: row.name!,
            createdAt: row.createdAt!,
            updatedAt: row.updatedAt!,
        };
    }

    async deleteSample(id: string): Promise<void> {
        await this.db.delete(sample).where(eq(sample.id, id))
    }
}