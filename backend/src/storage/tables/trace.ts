import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const trace = pgTable("trace", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    courseID: uuid("course_id").notNull(),
    professorID: uuid("professor_id").notNull(),
    departmentID: integer("department_id").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    timestamp: timestamp("timestamp", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});