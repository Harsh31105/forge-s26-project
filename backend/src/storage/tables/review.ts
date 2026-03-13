import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { student } from "./student";

export const review = pgTable("review", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid("student_id")
    .notNull()
    .references(() => student.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
