import {pgTable, uuid, timestamp, varchar} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sample = pgTable("sample", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});