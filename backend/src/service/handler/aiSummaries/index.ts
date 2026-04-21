import type { Request, Response } from "express";
import type { AiSummaryRepository, CourseThreadRepository, ProfThreadRepository } from "../../../storage/storage";
import { generateBatchSummaries, type ReviewInput } from "../../../ai/geminiClient";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 10;

export class AiSummaryHandler {
    constructor(
        private readonly aiSummaryRepo: AiSummaryRepository,
        private readonly courseThreadRepo: CourseThreadRepository,
        private readonly profThreadRepo: ProfThreadRepository,
    ) {}

    async handleGetPopular(req: Request, res: Response): Promise<void> {
        const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, 20);

        const [topCourse, topProf] = await Promise.all([
            this.aiSummaryRepo.getTopScoredReviews("course", limit),
            this.aiSummaryRepo.getTopScoredReviews("professor", limit),
        ]);

        const topReviews = [...topCourse, ...topProf]
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        const cached = await Promise.all(
            topReviews.map(r => this.aiSummaryRepo.getByReviewId(r.reviewId, r.reviewType)),
        );

        const staleIndexes = topReviews
            .map((_, i) => i)
            .filter(i => {
                const existing = cached[i];
                return !existing || (Date.now() - existing.summaryUpdatedAt.getTime()) > ONE_WEEK_MS;
            });

        if (staleIndexes.length > 0) {
            const reviewInputs: ReviewInput[] = await Promise.all(
                staleIndexes.map(async i => {
                    const review = topReviews[i]!;
                    if (review.reviewType === "course") {
                        const threads = await this.courseThreadRepo.getThreadsByCourseReviewId(
                            review.reviewId, { page: 1, limit: 20 },
                        );
                        return { reviewText: review.reviewText, threads: threads.map(t => t.content) };
                    } else {
                        const threads = await this.profThreadRepo.getThreadsByProfessorReviewId(
                            review.reviewId, { page: 1, limit: 20 },
                        );
                        return { reviewText: review.reviewText, threads: threads.map(t => t.content) };
                    }
                }),
            );

            try {
                const summaries = await generateBatchSummaries(reviewInputs);
                await Promise.all(
                    staleIndexes.map((reviewIndex, summaryIndex) => {
                        const review = topReviews[reviewIndex]!;
                        return this.aiSummaryRepo.upsertSummary({
                            reviewId: review.reviewId,
                            reviewType: review.reviewType,
                            summary: summaries[summaryIndex]!,
                            score: review.score,
                        });
                    }),
                );

                await Promise.all(
                    staleIndexes.map(async i => {
                        cached[i] = await this.aiSummaryRepo.getByReviewId(
                            topReviews[i]!.reviewId, topReviews[i]!.reviewType,
                        );
                    }),
                );
            } catch (err: any) {
                const status = err?.status ?? err?.response?.status ?? "unknown";
                console.error(`Batch summary generation failed [${status}]: ${err?.message ?? err}`);
            }
        }

        res.status(200).json(
            cached
                .map((summary, i) => summary ? { ...summary, displayName: topReviews[i]!.displayName } : null)
                .filter(Boolean),
        );
    }
}
