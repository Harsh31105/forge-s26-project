import request from "supertest";
import express, { Express } from "express";
import { RecommendationHandler } from "../recommendation";
import { Repository } from "../../../storage/storage";
import { errorHandler } from "../../../errs/httpError";

jest.setTimeout(30000);

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("RecommendationHandler Endpoints", () => {
    let app: Express;
    let mockRepo: jest.Mocked<Pick<Repository, "traces" | "favourites" | "courses" | "reviews">>;
    let handler: RecommendationHandler;

    const studentId = "550e8400-e29b-41d4-a716-446655440000";

    beforeEach(() => {
        mockRepo = {
            traces: { getAllTraces: jest.fn().mockResolvedValue([]) },
            favourites: { getFavourites: jest.fn().mockResolvedValue([]) },
            courses: { getCourses: jest.fn().mockResolvedValue([]) },
            reviews: { getReviews: jest.fn().mockResolvedValue([]) },
        } as unknown as jest.Mocked<Pick<Repository, "traces" | "favourites" | "courses" | "reviews">>;

        handler = new RecommendationHandler(mockRepo as unknown as Repository);

        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            req.user = { id: studentId, email: "test@husky.neu.edu", name: "Test User" };
            next();
        });
        app.post("/recommendations", handler.handleGetRecommendations.bind(handler));
        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /recommendations", () => {
        test("returns 400 if semester is missing", async () => {
            const res = await request(app).post("/recommendations").send({});
            expect(res.status).toBe(400);
        });

        test("returns 400 if semester is invalid", async () => {
            const res = await request(app).post("/recommendations").send({ semester: "winter" });
            expect(res.status).toBe(400);
        });

        test("returns 400 if user is not authenticated", async () => {
            const unauthApp = express();
            unauthApp.use(express.json());
            unauthApp.post("/recommendations", handler.handleGetRecommendations.bind(handler));
            unauthApp.use(errorHandler);

            const res = await request(unauthApp).post("/recommendations").send({ semester: "fall" });
            expect(res.status).toBe(400);
        });

        test("returns 502 if ML service is unreachable", async () => {
            mockFetch.mockRejectedValue(new Error("Connection refused"));
            const res = await request(app).post("/recommendations").send({ semester: "fall" });
            expect(res.status).toBe(502);
        });

        test("returns 200 with recommendations on success", async () => {
            const mockRecommendations = [{ course_id: "abc", score: 0.9 }];
            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockRecommendations),
            });

            const res = await request(app).post("/recommendations").send({ semester: "fall" });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockRecommendations);
        });
    });
});
