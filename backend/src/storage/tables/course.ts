import {pgTable, uuid, timestamp, varchar, pgEnum, integer, check} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { department } from "./department";

export const lectureTypeEnum = pgEnum("lecture_type_enum", ["lecture", "lab", "online"]);

export const course = pgTable("course", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    department_id: integer('department_id').references(() => department.id, { onDelete: "cascade" }).notNull(),
    course_code: integer("course_code").notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    num_credits: integer("num_credits").notNull(),
    lecture_type: lectureTypeEnum("lecture_type"), 
    createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).defaultNow().notNull(),
},
(table) => [
    check("course_code_range_check", sql`${table.course_code} >= 1000 AND ${table.course_code} < 10000`),
    check("num_credits_range_check", sql`${table.num_credits} >= 1 AND ${table.num_credits} <= 6`),
]);
