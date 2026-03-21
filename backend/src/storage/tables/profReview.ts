import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { professorTagEnum } from "./enums";
import { professor } from "./professor";
import { review } from "./review";

export const profReview = pgTable(
  "professor_review",
  {
    reviewId: uuid("review_id")
      .primaryKey()
      .references(() => review.id, { onDelete: "cascade" }), // FK to review
    professorId: uuid("professor_id")
      .notNull()
      .references(() => professor.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    reviewText: varchar("review_text", { length: 2000 }).notNull(),
    tags: professorTagEnum("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("prof_review_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);
