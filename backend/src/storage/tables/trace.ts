import {
  check,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { lectureTypeEnum, semesterEnum } from "./enums";
import { course } from "./course";
import { professor } from "./professor";
import { department } from "./department";

export const trace = pgTable(
  "trace",
  {
    id: serial("id").primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    professorId: uuid("professor_id")
      .notNull()
      .references(() => professor.id, { onDelete: "cascade" }),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    departmentId: integer("department_id")
      .notNull()
      .references(() => department.id, { onDelete: "cascade" }),
    courseCode: integer("course_code").notNull(),
    semester: semesterEnum("semester").notNull(),
    lectureYear: integer("lecture_year").notNull(),
    section: varchar("section", { length: 10 }),
    lectureType: lectureTypeEnum("lecture_type"),
    eval: text("eval"),
    hoursDevoted: jsonb("hours_devoted").$type<Record<string, number>>(),
    professorEfficiency: real("professor_efficiency"),
    howOftenPercentage: jsonb("how_often_percentage").$type<Record<string, number>>(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("trace_course_code_check", sql`${table.courseCode} BETWEEN 1000 AND 10000`),
    check("trace_lecture_year_check", sql`${table.lectureYear} BETWEEN 2000 AND 10000`),
    check(
      "trace_professor_efficiency_check",
      sql`${table.professorEfficiency} IS NULL OR ${table.professorEfficiency} BETWEEN 1.0 AND 5.0`,
    ),
  ],
);
