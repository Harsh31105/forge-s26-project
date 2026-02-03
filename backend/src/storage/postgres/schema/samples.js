"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleRepositorySchema = void 0;
const sample_1 = require("../../tables/sample");
const drizzle_orm_1 = require("drizzle-orm");
const httpError_1 = require("../../../errs/httpError");
class SampleRepositorySchema {
    db;
    constructor(db) {
        this.db = db;
        this.db = db;
    }
    async getSamples() {
        const rows = await this.db.select().from(sample_1.sample);
        return rows.map(r => ({
            ...r,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }
    async getSampleByID(id) {
        const [row] = await this.db.select().from(sample_1.sample).where((0, drizzle_orm_1.eq)(sample_1.sample.id, id));
        if (!row)
            throw new httpError_1.NotFoundError("sample with given ID not found");
        return {
            ...row,
            id: row.id,
            name: row.name,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    async createSample(input) {
        const [row] = await this.db.insert(sample_1.sample).values({
            name: input.name,
        }).returning();
        if (!row)
            throw new httpError_1.NotFoundError("sample with given ID not found");
        return {
            id: row.id,
            name: row.name,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    async patchSample(id, input) {
        const [row] = await this.db.update(sample_1.sample).set({ ...input }).where((0, drizzle_orm_1.eq)(sample_1.sample.id, id)).returning();
        if (!row)
            throw new httpError_1.NotFoundError("sample with given ID not found");
        return {
            ...row,
            id: row.id,
            name: row.name,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
    async deleteSample(id) {
        await this.db.delete(sample_1.sample).where((0, drizzle_orm_1.eq)(sample_1.sample.id, id));
    }
}
exports.SampleRepositorySchema = SampleRepositorySchema;
//# sourceMappingURL=samples.js.map