import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { courseTagEnum, professorTagEnum } from "./enums";

export const review = pgTable("review", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid("student_id"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courseReview = pgTable("course_review", {
  id: uuid("review_id")
    .primaryKey()
    .references(() => review.id, { onDelete: "cascade" }), // FK to review
  courseId: uuid("course_id").notNull(),
  rating: integer("rating").notNull(),
  reviewText: varchar("review_text").notNull(),
  tags: courseTagEnum("tags").array(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profReview = pgTable("professor_review", {
  id: uuid("review_id")
    .primaryKey()
    .references(() => review.id, { onDelete: "cascade" }), // FK to review
  professorId: uuid("professor_id").notNull(),
  rating: integer("rating").notNull(),
  reviewText: varchar("review_text").notNull(),
  tags: professorTagEnum("tags").array(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
