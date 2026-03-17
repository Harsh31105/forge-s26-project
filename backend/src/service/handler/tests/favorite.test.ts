import request from "supertest";
import express, { Express } from "express";
import { FavoriteHandler } from "../favorite";
import type { FavoriteRepository } from "../../../storage/storage";
import { FavoritePostInputType, Favorite } from "../../../models/favorite";
import { validate as isUUID } from "uuid";
import {errorHandler} from "../../../errs/httpError";

jest.mock("uuid", () => ({
    validate: jest.fn(),
}));
const mockValidate = isUUID as jest.Mock;

describe("FavoriteHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<FavoriteRepository>;
    let handler: FavoriteHandler;

    beforeEach(() => {
        repo = {
            getFavorites: jest.fn(),
            createFavorite: jest.fn(),
            deleteFavorite: jest.fn(),
        } as unknown as jest.Mocked<FavoriteRepository>;

        handler = new FavoriteHandler(repo);

        app = express();
        app.use(express.json());

        app.get("/favorites", handler.handleGet.bind(handler));
        app.post("/favorites", handler.handlePost.bind(handler));
        app.delete("/favorites/:student_id/:course_id", handler.handleDelete.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /favorites", () => {
            test("returns all favorites", async () => {
                const createdAt = new Date();
                const updatedAt = new Date();

                const data: Favorite[] = 
                [{ student_id: "123e4567-e89b-12d3-a456-426614174000", 
                    course_id: "550e8400-e29b-41d4-a716-446655440000", 
                    created_at: createdAt, 
                    updated_at: updatedAt } as Favorite,];

                repo.getFavorites.mockResolvedValue(data);
    
                const res = await request(app).get("/favorites");
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(1);
                expect(res.body[0].student_id).toBe(data[0]!.student_id);
                expect(res.body[0].course_id).toBe(data[0]!.course_id);
                expect(res.body[0].created_at).toBe(createdAt.toISOString());
                expect(res.body[0].updated_at).toBe(updatedAt.toISOString());
            });
    
            test("repository throws error", async () => {
                repo.getFavorites.mockRejectedValue(new Error("DB error"));
                const res = await request(app).get("/favorites");
                expect(res.status).toBe(500);
            });
        });

      


    describe("POST /favorites", () => {
        test("creates favorites", async () => {
            const payload: FavoritePostInputType = { 
                student_id: "123e4567-e89b-12d3-a456-426614174000",
                course_id: "550e8400-e29b-41d4-a716-446655440000" };

            const createdAt = new Date();
            const updatedAt = new Date();

            const createdFavorite: Favorite = { 
                student_id: "payload.student_id", 
                course_id: "payload.course_id",
                created_at: createdAt, 
                updated_at: updatedAt };
            repo.createFavorite.mockResolvedValue(createdFavorite);

            const res = await request(app).post("/favorites").send(payload);

            expect(res.status).toBe(201);
            expect(res.body.student_id).toBe(payload.student_id);
            expect(res.body.course_id).toBe(payload.course_id);
            expect(res.body.created_at).toBe(createdAt.toISOString());
            expect(res.body.updated_at).toBe(updatedAt.toISOString());

        });

        test("invalid input", async () => {
            const payload = { invalid: "bad" };

            const res = await request(app).post("/favorites").send(payload);
            expect(res.status).toBe(400);
        });
    });

    describe("DELETE /favorites/:student_id/:course_id", () => {
        test("deletes favorite", async () => {
            repo.deleteFavorite.mockResolvedValue(undefined);
            mockValidate.mockReturnValue(true);

            const studentId = "123e4567-e89b-12d3-a456-426614174000";
            const courseId = "550e8400-e29b-41d4-a716-446655440000";

            const res = await request(app).delete(`/favorites/${studentId}/${courseId}`);
            expect(res.status).toBe(204);
            expect(repo.deleteFavorite).toHaveBeenCalledWith(studentId, courseId);
        });

        test("invalid UUID", async () => {
            mockValidate.mockReturnValue(false);
            const res = await request(app).delete("/favorites/not-a-uuid/not-a-uuid");
            expect(res.status).toBe(400);
        });
    });
});
