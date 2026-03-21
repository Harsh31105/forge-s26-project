import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const trace = pgTable("trace", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id"),
    professorId: uuid("professor_id"),
    departmentId: integer("department_id"),
    action: varchar("action", { length: 255 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});