import request from "supertest";
import express, { Express } from "express";
import { FavouriteHandler } from "../favourite";
import { FavouriteRepository } from "../../../storage/storage";
import { Favourite, FavouritePostInputType } from "../../../models/favourite";
import { errorHandler } from "../../../errs/httpError";

jest.setTimeout(30000);

describe("FavouriteHandler Endpoints", () => {
    let app: Express;
    let repo: jest.Mocked<FavouriteRepository>;
    let handler: FavouriteHandler;

    const baseFavourite: Favourite = {
        studentId: "550e8400-e29b-41d4-a716-446655440000",
        courseId: "111e8400-e29b-41d4-a716-446655440000",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const makeFavourite = (overrides?: Partial<Favourite>): Favourite => ({
        studentId: overrides?.studentId ?? baseFavourite.studentId,
        courseId: overrides?.courseId ?? baseFavourite.courseId,
        createdAt: overrides?.createdAt ?? new Date(),
        updatedAt: overrides?.updatedAt ?? new Date(),
    });

    beforeEach(() => {
        repo = {
            getFavourites: jest.fn(),
            postFavourite: jest.fn(),
            deleteFavourite: jest.fn(),
        } as unknown as jest.Mocked<FavouriteRepository>;

        handler = new FavouriteHandler(repo);

        app = express();
        app.use(express.json());
        // mock authentication middleware for req.user
        app.use((req, _res, next) => {
            req.user = { id: baseFavourite.studentId, email: "meow@husky.neu.edu", name: "Meow" };
            next();
        });

        app.get("/favourites", handler.handleGet.bind(handler));
        app.post("/favourites", handler.handlePost.bind(handler));
        app.delete("/favourites/:id", handler.handleDelete.bind(handler));

        app.use(errorHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /favourites", () => {
        test("returns favourites", async () => {
            repo.getFavourites.mockResolvedValue([makeFavourite()]);
            const res = await request(app).get("/favourites");
            expect(res.status).toBe(200);
            expect(res.body[0]).toMatchObject({
                studentId: baseFavourite.studentId,
                courseId: baseFavourite.courseId,
            });
            expect(typeof res.body[0].createdAt).toBe("string");
        });

        test("repository error returns 500", async () => {
            repo.getFavourites.mockRejectedValue(new Error("DB failure"));
            const res = await request(app).get("/favourites");
            expect(res.status).toBe(500);
        });
    });

    describe("POST /favourites", () => {
        test("creates a favourite", async () => {
            const payload: FavouritePostInputType = {
                course_id: baseFavourite.courseId,
            };

            repo.postFavourite.mockResolvedValue(makeFavourite());

            const res = await request(app)
                .post("/favourites")
                .send(payload)
                .set("Content-Type", "application/json");

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                studentId: baseFavourite.studentId,
                courseId: baseFavourite.courseId,
            });
        });

        test("invalid input returns 400", async () => {
            const res = await request(app)
                .post("/favourites")
                .send({ course_id: "not-a-uuid" });

            expect(res.status).toBe(400);
            expect(repo.postFavourite).not.toHaveBeenCalled();
        });

        test("repository error returns 500", async () => {
            repo.postFavourite.mockRejectedValue(new Error("DB failure"));
            const res = await request(app)
                .post("/favourites")
                .send({ course_id: baseFavourite.courseId });

            expect(res.status).toBe(500);
        });
    });

    describe("DELETE /favourites/:id", () => {
        test("deletes a favourite", async () => {
            repo.deleteFavourite.mockResolvedValue(undefined);
            const res = await request(app).delete(`/favourites/${baseFavourite.courseId}`);
            expect(res.status).toBe(204);
        });

        test("repository error returns 500", async () => {
            repo.deleteFavourite.mockRejectedValue(new Error("DB failure"));
            const res = await request(app).delete(`/favourites/${baseFavourite.courseId}`);
            expect(res.status).toBe(500);
        });
    });
});