import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const favorite = pgTable(
    "favorite",
    {
        studentId: uuid("student_id").notNull(),
        courseId: uuid("course_id").notNull(),
        createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.studentId, table.courseId] }),
    })
);