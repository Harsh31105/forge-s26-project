import type { Request, Response } from "express";
import type { AiSummaryRepository, CourseThreadRepository, ProfThreadRepository } from "../../../storage/storage";
import { generateReviewSummary } from "../../../ai/geminiClient";
import { InternalServerError } from "../../../errs/httpError";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 5;

export class AiSummaryHandler {
    constructor(
        private readonly aiSummaryRepo: AiSummaryRepository,
        private readonly courseThreadRepo: CourseThreadRepository,
        private readonly profThreadRepo: ProfThreadRepository,
    ) {}

    // GET /ai-summaries/popular?limit=5
    async handleGetPopular(req: Request, res: Response): Promise<void> {
        const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, 20);

        // Fetch top scored reviews for both types in parallel
        const [topCourse, topProf] = await Promise.all([
            this.aiSummaryRepo.getTopScoredReviews("course", limit),
            this.aiSummaryRepo.getTopScoredReviews("professor", limit),
        ]);

        const topReviews = [...topCourse, ...topProf]
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // For each review: return cached summary or generate a new one
        const results = await Promise.all(topReviews.map(async (review) => {
            const existing = await this.aiSummaryRepo.getByReviewId(review.reviewId, review.reviewType);

            const isStale = !existing ||
                (Date.now() - existing.summaryUpdatedAt.getTime()) > ONE_WEEK_MS;

            if (!isStale) return existing;

            // Fetch thread replies to give the AI more context
            let threadContents: string[];
            try {
                if (review.reviewType === "course") {
                    const threads = await this.courseThreadRepo.getThreadsByCourseReviewId(
                        review.reviewId, { page: 1, limit: 20 },
                    );
                    threadContents = threads.map(t => t.content);
                } else {
                    const threads = await this.profThreadRepo.getThreadsByProfessorReviewId(
                        review.reviewId, { page: 1, limit: 20 },
                    );
                    threadContents = threads.map(t => t.content);
                }

                const summary = await generateReviewSummary(review.reviewText, threadContents);

                return this.aiSummaryRepo.upsertSummary({
                    reviewId: review.reviewId,
                    reviewType: review.reviewType,
                    summary,
                    score: review.score,
                });
            } catch (err) {
                console.error(`Failed to generate summary for review ${review.reviewId}:`, err);
                throw InternalServerError("failed to generate AI summary");
            }
        }));

        res.status(200).json(results);
    }
}
