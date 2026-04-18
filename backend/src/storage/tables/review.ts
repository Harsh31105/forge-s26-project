import { pgTable, uuid, timestamp, integer} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { student } from "./student";
import { semesterEnum } from "./enums";


export const review = pgTable("review", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: uuid("student_id")
    .notNull()
    .references(() => student.id, { onDelete: "cascade" }),
  semester: semesterEnum("semester"),
  year: integer("year"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});
