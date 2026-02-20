import { pgTable, uuid, varchar, integer, timestamp, check } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const prefEnum = pgEnum("pref_enum", [
  "exam-heavy",
  "project-heavy",
  "group-work",
  "attendance-required",
  "strict_deadlines",
  "flexible_deadlines",
  "extra_credit",
  "little_to_no_test",
  "fast_paced",
  "slow_paced",
]);

export const student = pgTable("student", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  graduationYear: integer("graduation_year"),
  preferences: prefEnum("preferences").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("graduation_year_check", sql`${table.graduationYear} >= 2025`),
]);
