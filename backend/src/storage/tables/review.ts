import { pgTable, uuid, timestamp, text, integer, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const review = pgTable("review", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    rating: integer("rating").notNull(),
    content: text("content").notNull(),
    courseId: varchar("course_id", { length: 100 }),
    profId: uuid("prof_id"),
    createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});
