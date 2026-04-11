import { pgTable, uuid, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const reviewTypeEnum = pgEnum("review_type", ["course", "professor"]);

export const aiSummary = pgTable("ai_summary", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id").notNull(),
  reviewType: reviewTypeEnum("review_type").notNull(),
  summary: text("summary").notNull(),
  score: real("score").notNull().default(0),
  summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});