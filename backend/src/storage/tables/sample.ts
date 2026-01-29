import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const sample = pgTable("sample", {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});