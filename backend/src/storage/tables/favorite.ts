import {pgTable, uuid, timestamp, varchar} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const favorite = pgTable("favorite", {
    student_id: uuid("student id").primaryKey().default(sql`gen_random_uuid()`),
    course_id: uuid("course id").primaryKey().default(sql`gen_random_uuid()`),
    created_at: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});