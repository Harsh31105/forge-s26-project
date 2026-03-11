// backend/src/service/handler/tests/profThreads.test.ts

import request from "supertest";
import express, { type Express } from "express";

import { ProfThreadHandler } from "../professorThreads";

import type { ProfThreadRepository } from "../../../storage/storage";
import type { ProfThread } from "../../../models/profThreads";
import { errorHandler } from "../../../errs/httpError";

// Mock uuid.validate so handler sees it; default true so valid-UUID tests pass unless overridden
jest.mock("uuid", () => ({
  validate: jest.fn(() => true),
}));

import { validate as isUUID } from "uuid";
const mockValidate = isUUID as unknown as jest.Mock;

function toJsonDates<T extends { createdAt: Date; updatedAt: Date }>(obj: T) {
  return {
    ...obj,
    createdAt: obj.createdAt.toISOString(),
    updatedAt: obj.updatedAt.toISOString(),
  };
}

describe("ProfThreadHandler Endpoints", () => {
  let app: Express;
  let repo: jest.Mocked<ProfThreadRepository>;
  let handler: ProfThreadHandler;

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Default: valid UUID (override in tests that expect 400). Restore after clearAllMocks.
    mockValidate.mockReturnValue(true);

    repo = {
      getThreadsByProfessorReviewId: jest.fn(),
      createThread: jest.fn(),
      patchThread: jest.fn(),
      deleteThread: jest.fn(),
    } as unknown as jest.Mocked<ProfThreadRepository>;

    handler = new ProfThreadHandler(repo);

    app = express();
    app.use(express.json());

    // Register routes with full paths (like sample.test.ts) so req.params.id / professor_id / thread_id are set

    //prof or professor - check

    app.get("/professor-reviews/:id/threads", (req, res, next) =>
      handler.handleGet(req, res).catch(next)
    );
    app.post("/professor-reviews/:id/threads", (req, res, next) =>
      handler.handlePost(req, res).catch(next)
    );
    app.patch("/professor-reviews/:professor_review_id/threads/:thread_id", (req, res, next) =>
      handler.handlePatch(req, res).catch(next)
    );
    app.delete("/professor-reviews/:professor_review_id/threads/:thread_id", (req, res, next) =>
      handler.handleDelete(req, res).catch(next)
    );

    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockValidate.mockReturnValue(true);
  });

  describe("GET /professor-reviews/:id/threads", () => {
    test("returns all threads for a professor review", async () => {
      mockValidate.mockReturnValue(true);

      const data: ProfThread[] = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          studentId: "22222222-2222-2222-2222-222222222222",
          professorReviewId: "33333333-3333-3333-3333-333333333333",
          content: "first thread",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ProfThread,
      ];

      repo.getThreadsByProfessorReviewId.mockResolvedValue(data);

      const res = await request(app).get(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(data.map((t) => toJsonDates(t)));
      expect(repo.getThreadsByProfessorReviewId).toHaveBeenCalledWith(
        "33333333-3333-3333-3333-333333333333",
        { page: 1, limit: 10 }
      );
    });

    test("respects custom pagination query params", async () => {
      mockValidate.mockReturnValue(true);
      repo.getThreadsByProfessorReviewId.mockResolvedValue([]);

      const res = await request(app).get(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads?page=2&limit=5"
      );

      expect(res.status).toBe(200);
      expect(repo.getThreadsByProfessorReviewId).toHaveBeenCalledWith(
        "33333333-3333-3333-3333-333333333333",
        { page: 2, limit: 5 }
      );
    });

    test("invalid pagination params returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app).get(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads?page=-1"
      );

      expect(res.status).toBe(400);
    });

    test("invalid professor review UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app).get("/professor-reviews/not-a-uuid/threads");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.getThreadsByProfessorReviewId.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads"
      );

      expect(res.status).toBe(500);
    });
  });

  describe("POST /professor-reviews/:id/threads", () => {
    test("creates a new thread and returns 201", async () => {
      mockValidate.mockReturnValue(true);

      const created: ProfThread = {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        studentId: "550e8400-e29b-41d4-a716-446655440000",
        professorReviewId: "33333333-3333-4333-a333-333333333333",
        content: "Great Professor",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProfThread;

      repo.createThread.mockResolvedValue(created);

      const res = await request(app)
        .post("/professor-reviews/33333333-3333-4333-a333-333333333333/threads")
        .send({
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Great Professor",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(toJsonDates(created));
      expect(repo.createThread).toHaveBeenCalledWith(
        "33333333-3333-4333-a333-333333333333",
        {
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Great Professor!",
        }
      );
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.createThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .post("/professor-reviews/33333333-3333-4333-a333-333333333333/threads")
        .send({
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Some content",
        });

      expect(res.status).toBe(500);
    });

    test("invalid professor review UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app)
        .post("/professor-reviews/not-a-uuid/threads")
        .send({
          studentId: "22222222-2222-2222-2222-222222222222",
          content: "x",
        });

      expect(res.status).toBe(400);
    });

    test("invalid body returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .post("/professor-reviews/33333333-3333-3333-3333-333333333333/threads")
        .send({ bad: "payload" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /professor-reviews/:professor_review_id/threads/:professor_thread_id", () => {
    test("updates a thread", async () => {
      mockValidate.mockReturnValue(true);

      const patchBody = { content: "updated content" };

      const updated: ProfThread = {
        id: "11111111-1111-1111-1111-111111111111",
        studentId: "22222222-2222-2222-2222-222222222222",
        professorReviewId: "33333333-3333-3333-3333-333333333333",
        content: patchBody.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProfThread;

      repo.patchThread.mockResolvedValue(updated);

      const res = await request(app)
        .patch(
          "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send(patchBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(toJsonDates(updated));

      expect(repo.patchThread).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        patchBody
      );
    });

    test("invalid professor_review_id returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app)
        .patch("/professor-reviews/not-a-uuid/threads/11111111-1111-1111-1111-111111111111")
        .send({ content: "x" });

      expect(res.status).toBe(400);
    });

    test("invalid professor_thread_id returns 400", async () => {
      mockValidate.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const res = await request(app)
        .patch("/professor-reviews/33333333-3333-3333-3333-333333333333/threads/not-a-uuid")
        .send({ content: "x" });

      expect(res.status).toBe(400);
    });

    test("invalid body returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(
          "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send({ nope: true });

      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.patchThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch(
          "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send({ content: "x" });

      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /professor-reviews/:professor_review_id/threads/:professor_thread_id", () => {
    test("deletes a thread", async () => {
      mockValidate.mockReturnValue(true);
      repo.deleteThread.mockResolvedValue(undefined);

      const res = await request(app).delete(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(204);
      expect(repo.deleteThread).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111"
      );
    });

    test("invalid professor_review_id returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app).delete(
        "/professor-reviews/not-a-uuid/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(400);
    });

    test("invalid professor_thread_id returns 400", async () => {
      mockValidate.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const res = await request(app).delete(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/not-a-uuid"
      );

      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.deleteThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app).delete(
        "/professor-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(500);
    });
  });
});
