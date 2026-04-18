import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import type { AiSummary, AiSummaryUpsertInput, ReviewWithScore } from "../../../models/aiSummary";
import type { AiSummaryRepository } from "../../storage";
import { aiSummary } from "../../tables/ai_summaries";
import { courseThread } from "../../tables/courseThread";
import { profThread } from "../../tables/profThread";
import { courseReview } from "../../tables/courseReview";
import { profReview } from "../../tables/profReview";

export class AiSummaryRepositorySchema implements AiSummaryRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getByReviewId(reviewId: string, reviewType: "course" | "professor"): Promise<AiSummary | null> {
        const [row] = await this.db
            .select()
            .from(aiSummary)
            .where(and(
                eq(aiSummary.reviewId, reviewId),
                eq(aiSummary.reviewType, reviewType),
            ));
        return row ?? null;
    }

    async upsertSummary(data: AiSummaryUpsertInput): Promise<AiSummary> {
        const [row] = await this.db
            .insert(aiSummary)
            .values({
                reviewId: data.reviewId,
                reviewType: data.reviewType,
                summary: data.summary,
                score: data.score,
            })
            .onConflictDoUpdate({
                target: [aiSummary.reviewId, aiSummary.reviewType],
                set: {
                    summary: sql`EXCLUDED.summary`,
                    score: sql`EXCLUDED.score`,
                    summaryUpdatedAt: sql`NOW()`,
                },
            })
            .returning();

        if (!row) throw new Error("Failed to upsert AI summary");
        return row;
    }

    async getTopScoredReviews(reviewType: "course" | "professor", limit: number): Promise<ReviewWithScore[]> {
        if (reviewType === "course") {
            const rows = await this.db.execute(sql`
                SELECT
                    cr.review_id       AS "reviewId",
                    'course'           AS "reviewType",
                    cr.review_text     AS "reviewText",
                    (
                        COUNT(ct.id) * 1.0 +
                        COUNT(DISTINCT ct.student_id) * 1.5 +
                        7.0 / (EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(ct.created_at), cr.created_at))) / 86400 + 1)
                    ) AS score
                FROM ${courseReview} cr
                LEFT JOIN ${courseThread} ct ON ct.course_review_id = cr.review_id
                GROUP BY cr.review_id, cr.review_text, cr.created_at
                ORDER BY score DESC
                LIMIT ${limit}
            `);
            return rows.rows as ReviewWithScore[];
        } else {
            const rows = await this.db.execute(sql`
                SELECT
                    pr.review_id       AS "reviewId",
                    'professor'        AS "reviewType",
                    pr.review_text     AS "reviewText",
                    (
                        COUNT(pt.id) * 1.0 +
                        COUNT(DISTINCT pt.student_id) * 2.0 +
                        10.0 / (EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(pt.created_at), pr.created_at))) / 86400 + 1)
                    ) AS score
                FROM ${profReview} pr
                LEFT JOIN ${profThread} pt ON pt.professor_review_id = pr.review_id
                GROUP BY pr.review_id, pr.review_text, pr.created_at
                ORDER BY score DESC
                LIMIT ${limit}
            `);
            return rows.rows as ReviewWithScore[];
        }
    }
}
