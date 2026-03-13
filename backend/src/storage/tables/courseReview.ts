import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { review } from "./review";
import { courseTagEnum } from "./enums";
import { course } from "./course";

export const courseReview = pgTable(
  "course_review",
  {
    id: uuid("review_id")
      .primaryKey()
      .references(() => review.id, { onDelete: "cascade" }), // FK to review
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(),
    reviewText: varchar("review_text", { length: 2000 }).notNull(),
    tags: courseTagEnum("tags").array(),
  },
  (table) => [
    check("course_review_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);
