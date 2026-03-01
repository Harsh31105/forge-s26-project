// backend/src/service/handler/tests/courseThreads.test.ts
// manan code


import request from "supertest";
import express, { type Express } from "express";

import { CourseThreadHandler } from "../courseThreads";

import type { CourseThreadRepository } from "../../../storage/storage";
import type { CourseThread } from "../../../models/courseThread";
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

describe("CourseThreadHandler Endpoints", () => {
  let app: Express;
  let repo: jest.Mocked<CourseThreadRepository>;
  let handler: CourseThreadHandler;

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Default: valid UUID (override in tests that expect 400). Restore after clearAllMocks.
    mockValidate.mockReturnValue(true);

    repo = {
      getThreadsByCourseReviewId: jest.fn(),
      createThread: jest.fn(),
      patchThread: jest.fn(),
      deleteThread: jest.fn(),
    } as unknown as jest.Mocked<CourseThreadRepository>;

    handler = new CourseThreadHandler(repo);

    app = express();
    app.use(express.json());

    // Register routes with full paths (like sample.test.ts) so req.params.id / course_id / thread_id are set
    app.get("/course-reviews/:id/threads", (req, res, next) =>
      handler.handleGet(req, res).catch(next)
    );
    app.post("/course-reviews/:id/threads", (req, res, next) =>
      handler.handlePost(req, res).catch(next)
    );
    app.patch("/course-reviews/:course_review_id/threads/:thread_id", (req, res, next) =>
      handler.handlePatch(req, res).catch(next)
    );
    app.delete("/course-reviews/:course_review_id/threads/:thread_id", (req, res, next) =>
      handler.handleDelete(req, res).catch(next)
    );

    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockValidate.mockReturnValue(true);
  });

  describe("GET /course-reviews/:id/threads", () => {
    test("returns all threads for a course review", async () => {
      mockValidate.mockReturnValue(true);

      const data: CourseThread[] = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          studentId: "22222222-2222-2222-2222-222222222222",
          courseReviewId: "33333333-3333-3333-3333-333333333333",
          content: "first thread",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CourseThread,
      ];

      repo.getThreadsByCourseReviewId.mockResolvedValue(data);

      const res = await request(app).get(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(data.map((t) => toJsonDates(t)));
      expect(repo.getThreadsByCourseReviewId).toHaveBeenCalledWith(
        "33333333-3333-3333-3333-333333333333",
        { page: 1, limit: 10 }
      );
    });

    test("respects custom pagination query params", async () => {
      mockValidate.mockReturnValue(true);
      repo.getThreadsByCourseReviewId.mockResolvedValue([]);

      const res = await request(app).get(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads?page=2&limit=5"
      );

      expect(res.status).toBe(200);
      expect(repo.getThreadsByCourseReviewId).toHaveBeenCalledWith(
        "33333333-3333-3333-3333-333333333333",
        { page: 2, limit: 5 }
      );
    });

    test("invalid pagination params returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app).get(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads?page=-1"
      );

      expect(res.status).toBe(400);
    });

    test("invalid course review UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app).get("/course-reviews/not-a-uuid/threads");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.getThreadsByCourseReviewId.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads"
      );

      expect(res.status).toBe(500);
    });
  });

  describe("POST /course-reviews/:id/threads", () => {
    test("creates a new thread and returns 201", async () => {
      mockValidate.mockReturnValue(true);

      const created: CourseThread = {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        studentId: "550e8400-e29b-41d4-a716-446655440000",
        courseReviewId: "33333333-3333-4333-a333-333333333333",
        content: "Great course!",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CourseThread;

      repo.createThread.mockResolvedValue(created);

      const res = await request(app)
        .post("/course-reviews/33333333-3333-4333-a333-333333333333/threads")
        .send({
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Great course!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(toJsonDates(created));
      expect(repo.createThread).toHaveBeenCalledWith(
        "33333333-3333-4333-a333-333333333333",
        {
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Great course!",
        }
      );
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.createThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .post("/course-reviews/33333333-3333-4333-a333-333333333333/threads")
        .send({
          studentId: "550e8400-e29b-41d4-a716-446655440000",
          content: "Some content",
        });

      expect(res.status).toBe(500);
    });

    test("invalid course review UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app)
        .post("/course-reviews/not-a-uuid/threads")
        .send({
          studentId: "22222222-2222-2222-2222-222222222222",
          content: "x",
        });

      expect(res.status).toBe(400);
    });

    test("invalid body returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .post("/course-reviews/33333333-3333-3333-3333-333333333333/threads")
        .send({ bad: "payload" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /course-reviews/:course_review_id/threads/:course_thread_id", () => {
    test("updates a thread", async () => {
      mockValidate.mockReturnValue(true);

      const patchBody = { content: "updated content" };

      const updated: CourseThread = {
        id: "11111111-1111-1111-1111-111111111111",
        studentId: "22222222-2222-2222-2222-222222222222",
        courseReviewId: "33333333-3333-3333-3333-333333333333",
        content: patchBody.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CourseThread;

      repo.patchThread.mockResolvedValue(updated);

      const res = await request(app)
        .patch(
          "/course-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send(patchBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(toJsonDates(updated));

      expect(repo.patchThread).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        patchBody
      );
    });

    test("invalid course_review_id returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app)
        .patch("/course-reviews/not-a-uuid/threads/11111111-1111-1111-1111-111111111111")
        .send({ content: "x" });

      expect(res.status).toBe(400);
    });

    test("invalid course_thread_id returns 400", async () => {
      mockValidate.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const res = await request(app)
        .patch("/course-reviews/33333333-3333-3333-3333-333333333333/threads/not-a-uuid")
        .send({ content: "x" });

      expect(res.status).toBe(400);
    });

    test("invalid body returns 400", async () => {
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(
          "/course-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send({ nope: true });

      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.patchThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .patch(
          "/course-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
        )
        .send({ content: "x" });

      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /course-reviews/:course_review_id/threads/:course_thread_id", () => {
    test("deletes a thread", async () => {
      mockValidate.mockReturnValue(true);
      repo.deleteThread.mockResolvedValue(undefined);

      const res = await request(app).delete(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(204);
      expect(repo.deleteThread).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111"
      );
    });

    test("invalid course_review_id returns 400", async () => {
      mockValidate.mockReturnValue(false);

      const res = await request(app).delete(
        "/course-reviews/not-a-uuid/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(400);
    });

    test("invalid course_thread_id returns 400", async () => {
      mockValidate.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const res = await request(app).delete(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads/not-a-uuid"
      );

      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      mockValidate.mockReturnValue(true);
      repo.deleteThread.mockRejectedValue(new Error("DB error"));

      const res = await request(app).delete(
        "/course-reviews/33333333-3333-3333-3333-333333333333/threads/11111111-1111-1111-1111-111111111111"
      );

      expect(res.status).toBe(500);
    });
  });
});
