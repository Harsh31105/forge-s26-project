import { pgTable, serial, varchar, uuid, integer, primaryKey } from "drizzle-orm/pg-core";
import { student } from "./student";

export const major = pgTable("major", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
});

export const concentration = pgTable("concentration", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
});

export const minor = pgTable("minor", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
});

export const studentMajor = pgTable("student_major", {
    studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    majorId: integer("major_id").notNull(),
}, (table) => [
    primaryKey({ columns: [table.studentId, table.majorId] }),
]);

export const studentConcentration = pgTable("student_concentration", {
    studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    concentrationId: integer("concentration_id").notNull(),
}, (table) => [
    primaryKey({ columns: [table.studentId, table.concentrationId] }),
]);

export const studentMinor = pgTable("student_minor", {
    studentId: uuid("student_id").notNull().references(() => student.id, { onDelete: "cascade" }),
    minorId: integer("minor_id").notNull(),
}, (table) => [
    primaryKey({ columns: [table.studentId, table.minorId] }),
]);
