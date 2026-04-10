import {
    integer,
    pgTable,
    serial,
    uuid,
    varchar,
    check,
    decimal,
    text,
    timestamp
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {lectureTypeEnum, semesterEnum} from "./enums";
import {course} from "./course";
import {professor} from "./professor";

export const trace = pgTable("trace", {
    id: serial("id").primaryKey(),
    courseId: uuid("course_id").notNull().references(() => course.id, { onDelete: "cascade" }),
    professorId: uuid("professor_id").notNull().references(() => professor.id, { onDelete: "cascade" }),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    departmentId: integer("department_id").notNull(),
    courseCode: integer("course_code").notNull(),
    semester: semesterEnum("semester").notNull(),
    lectureYear: integer("lecture_year").notNull(),
    lectureType: lectureTypeEnum("lecture_type"),
    howOftenPercentage: integer("how_often_percentage").notNull(),
    hoursDevoted: integer("hours_devoted").notNull(),
    professorEfficiency: decimal("professor_efficiency", { precision: 3, scale: 2 }).notNull(),
    eval: text("eval"),
    createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    check("course_code_check", sql`${table.courseCode} > 1000 AND ${table.courseCode} < 10000`),
    check("lecture_year_check", sql`${table.lectureYear} >= 2000 AND ${table.lectureYear} < 10000`),
    check("how_often_percentage_check", sql`${table.howOftenPercentage} >= 0 AND ${table.howOftenPercentage} <= 100`),
    check("hours_devoted_check", sql`${table.hoursDevoted} >= 0`),
    check("professor_efficiency_check", sql`${table.professorEfficiency} >= 1.00 AND ${table.professorEfficiency} <= 5.00`)
]);