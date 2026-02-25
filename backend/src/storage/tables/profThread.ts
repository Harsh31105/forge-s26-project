import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const profThread = pgTable("prof_thread", {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    profReviewId: uuid("prof_review_id").notNull(),
    content: varchar("content", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});