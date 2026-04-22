import { pgTable, serial, uuid, decimal, integer, timestamp, check } from "drizzle-orm/pg-core";
import { professor } from "./professor";
import { sql } from "drizzle-orm";

export const rmp = pgTable("rmp", {
    id: serial("id").primaryKey(),
    professorId: uuid("professor_id").notNull().references(() => professor.id, { onDelete: "cascade" }),
    ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }),
    ratingWta: integer("rating_wta"),
    avgDifficulty: decimal("avg_difficulty", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    check("rating_avg_check", sql`${table.ratingAvg} >= 1 AND ${table.ratingAvg} <= 5`),
    check("rating_wta_check", sql`${table.ratingWta} BETWEEN 0 AND 100`),
    check("avg_difficulty_check", sql`${table.avgDifficulty} IS NULL OR (${table.avgDifficulty} >= 1 AND ${table.avgDifficulty} <= 5)`),
]);