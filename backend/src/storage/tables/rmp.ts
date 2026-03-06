import { pgTable, serial, uuid, decimal, integer, timestamp } from "drizzle-orm/pg-core";
import { professor } from "./professor";

export const rmp = pgTable("rmp", {
    id: serial("id").primaryKey(),
    professorId: uuid("professor_id").notNull().references(() => professor.id, { onDelete: "cascade" }),
    ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }),
    ratingWta: integer("rating_wta"),
    avgDifficulty: decimal("avg_difficulty", { precision: 3, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});