"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.sample = (0, pg_core_1.pgTable)("sample", {
    id: (0, pg_core_1.uuid)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
//# sourceMappingURL=sample.js.map