import { pgTable, serial, uuid, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { course } from "./course";
import { professor } from "./professor";
import { semesterEnum, lectureTypeEnum } from "./enums";

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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
