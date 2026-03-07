import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { student } from "./student";
import { profReview } from "./profReview";

export const profThread = pgTable("professor_thread", {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    professorReviewId: uuid("professor_review_id").notNull().references(() => profReview.reviewId, { onDelete: "cascade" }),
    content: varchar("content", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});