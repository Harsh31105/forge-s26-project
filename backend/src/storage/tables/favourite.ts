import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { student } from "./student";
import { course } from "./course";

export const favorite = pgTable("favorite", {
        studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
        courseId: uuid("course_id").notNull().references(() => course.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.studentId, table.courseId] }),
    })
);