"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const samples_1 = require("./postgres/schema/samples");
class Repository {
    samples;
    pool;
    db;
    constructor(pool, db) {
        this.pool = pool;
        this.db = db;
        this.samples = new samples_1.SampleRepositorySchema(db);
    }
    async getDB() {
        return this.db;
    }
    async close() {
        await this.pool.end();
    }
}
exports.Repository = Repository;
//# sourceMappingURL=storage.js.map