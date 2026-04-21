import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import type { AiSummary, AiSummaryUpsertInput, ReviewWithScore } from "../../../models/aiSummary";
import type { AiSummaryRepository } from "../../storage";
import { aiSummary } from "../../tables/ai_summaries";
import { courseThread } from "../../tables/courseThread";
import { profThread } from "../../tables/profThread";
import { courseReview } from "../../tables/courseReview";
import { profReview } from "../../tables/profReview";
import { course } from "../../tables/course";
import { department } from "../../tables/department";
import { professor } from "../../tables/professor";

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

    async markStaleIfThresholdMet(reviewId: string, reviewType: "course" | "professor", threshold: number): Promise<void> {
        const existing = await this.getByReviewId(reviewId, reviewType);
        if (!existing) return;

        const since = existing.summaryUpdatedAt;

        let newCount = 0;
        let oldCount = 0;

        if (reviewType === "course") {
            const [result] = await this.db
                .select({
                    newCount: sql<number>`cast(count(*) filter (where ${courseThread.createdAt} > ${since}) as int)`,
                    oldCount: sql<number>`cast(count(*) filter (where ${courseThread.createdAt} <= ${since}) as int)`,
                })
                .from(courseThread)
                .where(eq(courseThread.courseReviewId, reviewId));
            newCount = result?.newCount ?? 0;
            oldCount = result?.oldCount ?? 0;
        } else {
            const [result] = await this.db
                .select({
                    newCount: sql<number>`cast(count(*) filter (where ${profThread.createdAt} > ${since}) as int)`,
                    oldCount: sql<number>`cast(count(*) filter (where ${profThread.createdAt} <= ${since}) as int)`,
                })
                .from(profThread)
                .where(eq(profThread.professorReviewId, reviewId));
            newCount = result?.newCount ?? 0;
            oldCount = result?.oldCount ?? 0;
        }

        if (newCount / (oldCount + 1) >= threshold) {
            await this.db
                .update(aiSummary)
                .set({ summaryUpdatedAt: new Date(0) })
                .where(and(
                    eq(aiSummary.reviewId, reviewId),
                    eq(aiSummary.reviewType, reviewType),
                ));
        }
    }

    async getTopScoredReviews(reviewType: "course" | "professor", limit: number): Promise<ReviewWithScore[]> {
        if (reviewType === "course") {
            const rows = await this.db.execute(sql`
                SELECT
                    cr.review_id       AS "reviewId",
                    'course'           AS "reviewType",
                    cr.review_text     AS "reviewText",
                    d.name || ' ' || c.course_code AS "displayName",
                    (
                        COUNT(ct.id) * 1.0 +
                        COUNT(DISTINCT ct.student_id) * 1.5 +
                        7.0 / (EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(ct.created_at), cr.created_at))) / 86400 + 1)
                    ) AS score
                FROM ${courseReview} cr
                LEFT JOIN ${courseThread} ct ON ct.course_review_id = cr.review_id
                JOIN ${course} c ON c.id = cr.course_id
                JOIN ${department} d ON d.id = c.department_id
                GROUP BY cr.review_id, cr.review_text, cr.created_at, d.name, c.course_code
                ORDER BY score DESC
                LIMIT ${limit}
            `);

            return (rows.rows as Array<Record<string, unknown>>).map(row => ({
                reviewId: row.reviewId as string,
                reviewType: row.reviewType as "course" | "professor",
                reviewText: row.reviewText as string,
                displayName: row.displayName as string,
                score: row.score as number,
            }));

        } else {
            const rows = await this.db.execute(sql`
                SELECT
                    pr.review_id       AS "reviewId",
                    'professor'        AS "reviewType",
                    pr.review_text     AS "reviewText",
                    p.first_name || ' ' || p.last_name AS "displayName",
                    (
                        COUNT(pt.id) * 1.0 +
                        COUNT(DISTINCT pt.student_id) * 2.0 +
                        7.0 / (EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(pt.created_at), pr.created_at))) / 86400 + 1)
                    ) AS score
                FROM ${profReview} pr
                LEFT JOIN ${profThread} pt ON pt.professor_review_id = pr.review_id
                JOIN ${professor} p ON p.id = pr.professor_id
                GROUP BY pr.review_id, pr.review_text, pr.created_at, p.first_name, p.last_name
                ORDER BY score DESC
                LIMIT ${limit}
            `);
            return (rows.rows as Array<Record<string, unknown>>).map(row => ({
                reviewId: row.reviewId as string,
                reviewType: row.reviewType as "course" | "professor",
                reviewText: row.reviewText as string,
                displayName: row.displayName as string,
                score: row.score as number,
            }));
        }
    }
}
