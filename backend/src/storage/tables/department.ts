import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const department = pgTable("department", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 10 }).notNull().unique(),
});
