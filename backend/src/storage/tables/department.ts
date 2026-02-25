import { pgTable, varchar, serial } from "drizzle-orm/pg-core";

export const department = pgTable("department", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull().unique(),
});