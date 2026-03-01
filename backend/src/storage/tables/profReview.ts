import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";

export const profReview = pgTable("prof_review", {
    reviewId: uuid("review_id").primaryKey(),
    courseId: uuid("course_id").notNull(),
    rating: integer("rating").notNull(),
    reviewText: varchar("review_text", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
