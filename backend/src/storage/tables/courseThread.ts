import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { student } from "./student";
import { courseReview } from "./courseReview";

export const courseThread = pgTable("course_thread", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
  courseReviewId: uuid("course_review_id").notNull().references(() => courseReview.reviewId, { onDelete: "cascade" }),
  content: varchar("content", { length: 2000 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
