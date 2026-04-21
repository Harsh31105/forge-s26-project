import request from "supertest";
import express, { type Express } from "express";

import { AiSummaryHandler } from "../aiSummaries";
import type { AiSummaryRepository, CourseThreadRepository, ProfThreadRepository } from "../../../storage/storage";
import type { AiSummary, ReviewWithScore } from "../../../models/aiSummary";
import { errorHandler } from "../../../errs/httpError";
import * as geminiClient from "../../../ai/geminiClient";

jest.mock("../../../ai/geminiClient");

const mockGenerateBatchSummaries = geminiClient.generateBatchSummaries as jest.Mock;
const REVIEW_ID_1 = "11111111-1111-1111-1111-111111111111";
const REVIEW_ID_2 = "22222222-2222-2222-2222-222222222222";

function makeSummary(
    reviewId: string,
    reviewType: "course" | "professor",
    ageMs = 0,
): AiSummary {
    return {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        reviewId,
        reviewType,
        summary: "summary testing",
        score: 5.0,
        summaryUpdatedAt: new Date(Date.now() - ageMs),
        createdAt: new Date(),
    };
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("AiSummaryHandler Endpoints", () => {
    let app: Express;
    let aiSummaryRepo: jest.Mocked<AiSummaryRepository>;
    let courseThreadRepo: jest.Mocked<CourseThreadRepository>;
    let profThreadRepo: jest.Mocked<ProfThreadRepository>;
    let handler: AiSummaryHandler;

    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        aiSummaryRepo = {
            getTopScoredReviews: jest.fn(),
            getByReviewId: jest.fn(),
            upsertSummary: jest.fn(),
            markStaleIfThresholdMet: jest.fn(),
        } as unknown as jest.Mocked<AiSummaryRepository>;

        courseThreadRepo = {
            getThreadsByCourseReviewId: jest.fn(),
            createThread: jest.fn(),
            patchThread: jest.fn(),
            deleteThread: jest.fn(),
        } as unknown as jest.Mocked<CourseThreadRepository>;

        profThreadRepo = {
            getThreadsByProfessorReviewId: jest.fn(),
            createThread: jest.fn(),
            patchThread: jest.fn(),
            deleteThread: jest.fn(),
        } as unknown as jest.Mocked<ProfThreadRepository>;

        handler = new AiSummaryHandler(aiSummaryRepo, courseThreadRepo, profThreadRepo);

        app = express();
        app.use(express.json());
        app.get("/ai-summaries/popular", (req, res, next) =>
            handler.handleGetPopular(req, res).catch(next),
        );
        app.use(errorHandler);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe("GET /ai-summaries/popular", () => {
        test("returns 200 with empty array when no top reviews exist", async () => {
            aiSummaryRepo.getTopScoredReviews.mockResolvedValue([]);

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
            expect(mockGenerateBatchSummaries).not.toHaveBeenCalled();
        });

        test("returns cached fresh summaries without requesting from Gemini API", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1,
                reviewType: "course",
                reviewText: "good course",
                score: 10,
                displayName: "Course Test",
            };
            const fresh = makeSummary(REVIEW_ID_1, "course", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([topReview])
                .mockResolvedValueOnce([]);
            aiSummaryRepo.getByReviewId.mockResolvedValue(fresh);

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].reviewId).toBe(REVIEW_ID_1);
            expect(mockGenerateBatchSummaries).not.toHaveBeenCalled();
        });

        test("calls Gemini and upserts when summary is missing", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1,
                reviewType: "course",
                reviewText: "good course",
                score: 10,
                displayName: "Course Test",
            };
            const upserted = makeSummary(REVIEW_ID_1, "course", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([topReview])
                .mockResolvedValueOnce([]);
            aiSummaryRepo.getByReviewId
                .mockResolvedValueOnce(null)       
                .mockResolvedValueOnce(upserted); 
            courseThreadRepo.getThreadsByCourseReviewId.mockResolvedValue([]);
            mockGenerateBatchSummaries.mockResolvedValue(["Generated summary"]);
            aiSummaryRepo.upsertSummary.mockResolvedValue(upserted);

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(mockGenerateBatchSummaries).toHaveBeenCalledTimes(1);
            expect(aiSummaryRepo.upsertSummary).toHaveBeenCalledWith({
                reviewId: REVIEW_ID_1,
                reviewType: "course",
                summary: "Generated summary",
                score: 10,
            });
        });

        test("calls Gemini and upserts when summary is old", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1,
                reviewType: "professor",
                reviewText: "Great prof",
                score: 8,
                displayName: "Professor Test",
            };
            const old = makeSummary(REVIEW_ID_1, "professor", ONE_WEEK_MS + 1000);
            const fresh = makeSummary(REVIEW_ID_1, "professor", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([topReview]);
            aiSummaryRepo.getByReviewId
                .mockResolvedValueOnce(old)  
                .mockResolvedValueOnce(fresh);
            profThreadRepo.getThreadsByProfessorReviewId.mockResolvedValue([]);
            mockGenerateBatchSummaries.mockResolvedValue(["Updated summary"]);
            aiSummaryRepo.upsertSummary.mockResolvedValue(fresh);

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(mockGenerateBatchSummaries).toHaveBeenCalledTimes(1);
            expect(aiSummaryRepo.upsertSummary).toHaveBeenCalledWith({
                reviewId: REVIEW_ID_1,
                reviewType: "professor",
                summary: "Updated summary",
                score: 8,
            });
        });

        test("handles Gemini failure gracefully and returns cached data", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1,
                reviewType: "course",
                reviewText: "Great course",
                score: 10,
                displayName: "Course Test",
            };
            const old = makeSummary(REVIEW_ID_1, "course", ONE_WEEK_MS + 1000);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([topReview])
                .mockResolvedValueOnce([]);
            aiSummaryRepo.getByReviewId.mockResolvedValue(old);
            courseThreadRepo.getThreadsByCourseReviewId.mockResolvedValue([]);
            mockGenerateBatchSummaries.mockRejectedValue(new Error("Gemini API error"));

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(aiSummaryRepo.upsertSummary).not.toHaveBeenCalled();
        });

        test("includes thread content when calling Gemini for a course review", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1,
                reviewType: "course",
                reviewText: "Great course",
                score: 10,
                displayName: "Course Test",
            };
            const upserted = makeSummary(REVIEW_ID_1, "course", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([topReview])
                .mockResolvedValueOnce([]);
            aiSummaryRepo.getByReviewId
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(upserted);
            courseThreadRepo.getThreadsByCourseReviewId.mockResolvedValue([
                { id: "t1", content: "thread one", courseReviewId: REVIEW_ID_1, studentId: "s1", createdAt: new Date(), updatedAt: new Date() } as any,
                { id: "t2", content: "thread two", courseReviewId: REVIEW_ID_1, studentId: "s2", createdAt: new Date(), updatedAt: new Date() } as any,
            ]);
            mockGenerateBatchSummaries.mockResolvedValue(["Summary"]);
            aiSummaryRepo.upsertSummary.mockResolvedValue(upserted);

            await request(app).get("/ai-summaries/popular");

            expect(mockGenerateBatchSummaries).toHaveBeenCalledWith([
                { reviewText: "Great course", threads: ["thread one", "thread two"] },
            ]);
        });

        test("includes thread content when calling Gemini for a professor review", async () => {
            const topReview: ReviewWithScore = {
                reviewId: REVIEW_ID_2,
                reviewType: "professor",
                reviewText: "Great prof",
                score: 9,
                displayName: "Professor Test",
            };
            const upserted = makeSummary(REVIEW_ID_2, "professor", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([topReview]);
            aiSummaryRepo.getByReviewId
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(upserted);
            profThreadRepo.getThreadsByProfessorReviewId.mockResolvedValue([
                { id: "t3", content: "prof thread", professorReviewId: REVIEW_ID_2, studentId: "s1", createdAt: new Date(), updatedAt: new Date() } as any,
            ]);
            mockGenerateBatchSummaries.mockResolvedValue(["Prof Summary"]);
            aiSummaryRepo.upsertSummary.mockResolvedValue(upserted);

            await request(app).get("/ai-summaries/popular");

            expect(mockGenerateBatchSummaries).toHaveBeenCalledWith([
                { reviewText: "Great prof", threads: ["prof thread"] },
            ]);
        });

        test("merges and sorts course and professor reviews by score", async () => {
            const courseReview: ReviewWithScore = {
                reviewId: REVIEW_ID_1, reviewType: "course", reviewText: "Good", score: 5, displayName: "Course Test",
            };
            const profReview: ReviewWithScore = {
                reviewId: REVIEW_ID_2, reviewType: "professor", reviewText: "Better", score: 10, displayName: "Professor Test",
            };
            const courseSummary = makeSummary(REVIEW_ID_1, "course", 0);
            const profSummary = makeSummary(REVIEW_ID_2, "professor", 0);

            aiSummaryRepo.getTopScoredReviews
                .mockResolvedValueOnce([courseReview])
                .mockResolvedValueOnce([profReview]);
            aiSummaryRepo.getByReviewId
                .mockResolvedValueOnce(profSummary)   
                .mockResolvedValueOnce(courseSummary); 

            const res = await request(app).get("/ai-summaries/popular");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].reviewId).toBe(REVIEW_ID_2);
        });

    });
});
