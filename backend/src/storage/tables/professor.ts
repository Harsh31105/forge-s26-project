// professor.ts table

import { pgTable, uuid, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const locationTagEnum = pgEnum("location_tag_enum", ["boston", "oakland", "london"]);

export type LocationTag = typeof locationTagEnum.enumValues[number];

export const professor = pgTable("professor", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    tags: locationTagEnum("tags").array(),
    createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});