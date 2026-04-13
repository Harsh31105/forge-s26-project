import { pgTable, uuid, varchar, integer, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { department } from "./department";
import { lectureTypeEnum } from "./enums";

export const course = pgTable("course", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  departmentId: integer("department_id").notNull().references(() => department.id, { onDelete: "cascade" }),
  courseCode: integer("course_code").notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  numCredits: integer("num_credits").notNull(),
  lectureType: lectureTypeEnum("lecture_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("course_code_check", sql`${table.courseCode} BETWEEN 1000 AND 10000`),
  check("num_credits_check", sql`${table.numCredits} BETWEEN 1 AND 6`),
]);
