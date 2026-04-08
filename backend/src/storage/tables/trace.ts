import { pgTable, serial, uuid, varchar, integer, timestamp, real, text } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { lectureTypeEnum } from "./course";
import { course } from "./course";
import { professor } from "./professor";
import { department } from "./department";

export const semesterEnum = pgEnum("semester_enum", ["fall", "spring", "summer_1", "summer_2"]);

export const trace = pgTable("trace", {
    id: serial("id").primaryKey(),
    courseId: uuid("course_id").notNull().references(() => course.id),
    professorId: uuid("professor_id").notNull().references(() => professor.id),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    departmentId: integer("department_id").notNull().references(() => department.id),
    courseCode: integer("course_code").notNull(),
    semester: semesterEnum("semester").notNull(),
    lectureYear: integer("lecture_year").notNull(),
    lectureType: lectureTypeEnum("lecture_type"),
    eval: text("eval"),
    hoursDevoted: integer("hours_devoted"),
    professorEfficiency: real("professor_efficiency"),
    howOftenPercentage: integer("how_often_percentage"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
