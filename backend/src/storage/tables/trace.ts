import { pgTable, serial, uuid, varchar, integer, timestamp, real, jsonb, text } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { lectureTypeEnum } from "./course";

export const semesterEnum = pgEnum("semester_enum", ["fall", "spring", "summer_1", "summer_2"]);

export const trace = pgTable("trace", {
    id: serial("id").primaryKey(),
    courseId: uuid("course_id").notNull(),
    professorId: uuid("professor_id").notNull(),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    departmentId: integer("department_id").notNull(),
    courseCode: integer("course_code").notNull(),
    semester: semesterEnum("semester").notNull(),
    lectureYear: integer("lecture_year").notNull(),
    lectureType: lectureTypeEnum("lecture_type"),
    eval: text("eval"),
    hoursDevoted: jsonb("hours_devoted").$type<Record<string, number>>(),
    professorEfficiency: real("professor_efficiency"),
    howOftenPercentage: jsonb("how_often_percentage").$type<Record<string, number>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
