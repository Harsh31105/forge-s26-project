import request from "supertest";
import express, { Express } from "express";
import { ReviewHandler } from "../reviews/index";
import type { ReviewRepository } from "../../../storage/storage";
import {
  CourseReview,
  ProfessorReview,
  ReviewPatchInputType,
} from "../../../models/review";
import { validate as isUUID } from "uuid";
import { errorHandler, NotFoundError } from "../../../errs/httpError";

jest.mock("uuid", () => ({
  validate: jest.fn(),
}));
const mockValidate = isUUID as jest.Mock;

const mockCourseReview: CourseReview = {
  reviewId: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
  studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
  rating: 4,
  reviewText: "Great course, highly recommend!",
  tags: ["challenging", "rewarding"],
  createdAt: new Date("2026-01-15T10:30:00Z"),
  updatedAt: new Date("2026-01-15T10:30:00Z"),
};

const mockProfReview: ProfessorReview = {
  reviewId: "e4da3b7f-bbce-4a9b-9f0e-1c2f3a4b5c6d",
  studentId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
  rating: 5,
  reviewText: "Excellent professor, very clear explanations.",
  tags: ["engaging"],
  createdAt: new Date("2026-01-18T10:30:00Z"),
  updatedAt: new Date("2026-01-18T10:30:00Z"),
};

describe("ReviewHandler Endpoints", () => {
  let app: Express;
  let repo: jest.Mocked<ReviewRepository>;
  let handler: ReviewHandler;

  beforeEach(() => {
    repo = {
      getReviews: jest.fn(),
      getReviewByID: jest.fn(),
      createParentReview: jest.fn(),
      createCourseReview: jest.fn(),
      createProfessorReview: jest.fn(),
      patchReview: jest.fn(),
      deleteReview: jest.fn(),
    } as unknown as jest.Mocked<ReviewRepository>;

    handler = new ReviewHandler(repo);

    app = express();
    app.use(express.json());

    app.get("/reviews", handler.handleGet.bind(handler));
    app.get("/reviews/:id", handler.handleGetByID.bind(handler));
    app.post("/reviews", handler.handlePost.bind(handler));
    app.patch("/reviews/:id", handler.handlePatch.bind(handler));
    app.delete("/reviews/:id", handler.handleDelete.bind(handler));

    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /reviews", () => {
    test("returns all reviews with default pagination", async () => {
      repo.getReviews.mockResolvedValue([mockCourseReview, mockProfReview]);

      const res = await request(app).get("/reviews");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toMatchObject({
        reviewId: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Great course, highly recommend!",
      });
      expect(res.body[1]).toMatchObject({
        reviewId: "e4da3b7f-bbce-4a9b-9f0e-1c2f3a4b5c6d",
        professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
        rating: 5,
      });
    });

    test("returns empty array when no reviews", async () => {
      repo.getReviews.mockResolvedValue([]);
      const res = await request(app).get("/reviews");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("returns reviews with explicit pagination", async () => {
      repo.getReviews.mockResolvedValue([mockCourseReview]);
      const res = await request(app).get("/reviews?limit=10&page=1");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(repo.getReviews).toHaveBeenCalledWith({ limit: 10, page: 1 });
    });

    test("invalid pagination - limit too low", async () => {
      const res = await request(app).get("/reviews?limit=0");
      expect(res.status).toBe(400);
    });

    test("invalid pagination - limit too high", async () => {
      const res = await request(app).get("/reviews?limit=101");
      expect(res.status).toBe(400);
    });

    test("invalid pagination - page below minimum", async () => {
      const res = await request(app).get("/reviews?page=0");
      expect(res.status).toBe(400);
    });

    test("repository throws error", async () => {
      repo.getReviews.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/reviews");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /reviews/:id", () => {
    test("returns course review by ID", async () => {
      repo.getReviewByID.mockResolvedValue(mockCourseReview);
      mockValidate.mockReturnValue(true);

      const res = await request(app).get(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        reviewId: "57166e68-57ee-4fd4-a08f-2b3ea3bcd1bb",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Great course, highly recommend!",
      });
    });

    test("returns professor review by ID", async () => {
      repo.getReviewByID.mockResolvedValue(mockProfReview);
      mockValidate.mockReturnValue(true);

      const res = await request(app).get(`/reviews/${mockProfReview.reviewId}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        reviewId: "e4da3b7f-bbce-4a9b-9f0e-1c2f3a4b5c6d",
        professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
        rating: 5,
      });
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).get("/reviews/invalid-uuid");
      expect(res.status).toBe(400);
    });

    test("review not found returns 404", async () => {
      repo.getReviewByID.mockRejectedValue(
        new NotFoundError("review not found"),
      );
      mockValidate.mockReturnValue(true);
      const res = await request(app).get(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(404);
    });

    test("repository throws error returns 500", async () => {
      repo.getReviewByID.mockRejectedValue(new Error("DB error"));
      mockValidate.mockReturnValue(true);
      const res = await request(app).get(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(500);
    });
  });

  describe("POST /reviews", () => {
    test("creates a course review", async () => {
      const parentId = "parent-uuid-1234-5678-abcd-ef1234567890";
      repo.createParentReview.mockResolvedValue(parentId);
      repo.createCourseReview.mockResolvedValue(mockCourseReview);

      const payload = {
        studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Great course, highly recommend!",
        tags: ["challenging", "exam_heavy"],
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Great course, highly recommend!",
      });
      expect(repo.createParentReview).toHaveBeenCalledWith(payload.studentId);
      expect(repo.createCourseReview).toHaveBeenCalledWith(parentId, {
        courseId: payload.courseId,
        rating: payload.rating,
        reviewText: payload.reviewText,
        tags: ["challenging", "exam_heavy"],
      });
    });

    test("creates a professor review", async () => {
      const parentId = "parent-uuid-5678-1234-abcd-ef1234567890";
      repo.createParentReview.mockResolvedValue(parentId);
      repo.createProfessorReview.mockResolvedValue(mockProfReview);

      const payload = {
        studentId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
        rating: 5,
        reviewText: "Excellent professor, very clear explanations.",
        tags: ["engaging"],
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
        rating: 5,
      });
      expect(repo.createParentReview).toHaveBeenCalledWith(payload.studentId);
      expect(repo.createProfessorReview).toHaveBeenCalledWith(parentId, {
        professorId: payload.professorId,
        rating: payload.rating,
        reviewText: payload.reviewText,
        tags: payload.tags,
      });
    });

    test("creates review without tags", async () => {
      const parentId = "parent-uuid-no-tags-abcd-ef1234567890";
      const reviewNoTags: CourseReview = {
        ...mockCourseReview,
        tags: undefined,
      };
      repo.createParentReview.mockResolvedValue(parentId);
      repo.createCourseReview.mockResolvedValue(reviewNoTags);

      const payload = {
        studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 3,
        reviewText: "Decent course.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(201);
      expect(repo.createCourseReview).toHaveBeenCalledWith(parentId, {
        courseId: payload.courseId,
        rating: payload.rating,
        reviewText: payload.reviewText,
      });
    });

    test("creates review without studentId returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Great course!",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("censors profane review text", async () => {
      const parentId = "parent-uuid-censor-abcd-ef1234567890";
      repo.createParentReview.mockResolvedValue(parentId);
      repo.createCourseReview.mockResolvedValue(mockCourseReview);

      const payload = {
        studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 1,
        reviewText: "This is a damn awful course",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(201);
      // Verify that the text passed to createCourseReview was censored (not the raw input)
      const calledWith = repo.createCourseReview.mock.calls[0]![1]!;
      expect(calledWith.reviewText).not.toBe(payload.reviewText);
    });

    test("both courseId and professorId provided returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        professorId: "c3d4e5f6-a7b8-4012-8def-123456789012",
        rating: 4,
        reviewText: "Conflicting IDs.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("neither courseId nor professorId provided returns 400", async () => {
      const payload = {
        rating: 4,
        reviewText: "No target specified.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("rating below minimum returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 0,
        reviewText: "Rating too low.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("rating above maximum returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 6,
        reviewText: "Rating too high.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("empty reviewText returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 3,
        reviewText: "",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("missing rating returns 400", async () => {
      const payload = {
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        reviewText: "No rating.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("repository throws foreign key error returns 400", async () => {
      repo.createParentReview.mockRejectedValue(
        new Error("foreign key constraint"),
      );

      const payload = {
        studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Foreign key error.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(400);
    });

    test("repository throws generic error returns 500", async () => {
      repo.createParentReview.mockRejectedValue(new Error("DB error"));

      const payload = {
        studentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        courseId: "d9b1d7db-5c8e-4a9b-9f0e-1c2f3a4b5c6d",
        rating: 4,
        reviewText: "Some review.",
      };

      const res = await request(app).post("/reviews").send(payload);
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /reviews/:id", () => {
    test("patches rating", async () => {
      const patch: ReviewPatchInputType = { rating: 5 };
      const updated: CourseReview = { ...mockCourseReview, rating: 5 };
      repo.patchReview.mockResolvedValue(updated);
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send(patch);
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(5);
    });

    test("patches reviewText", async () => {
      const patch: ReviewPatchInputType = {
        reviewText: "Updated review text.",
      };
      const updated: CourseReview = {
        ...mockCourseReview,
        reviewText: "Updated review text.",
      };
      repo.patchReview.mockResolvedValue(updated);
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send(patch);
      expect(res.status).toBe(200);
      expect(res.body.reviewText).toBe("Updated review text.");
    });

    test("patches multiple fields", async () => {
      const patch: ReviewPatchInputType = {
        rating: 2,
        reviewText: "Changed my mind.",
        tags: ["hard"],
      };
      const updated: CourseReview = {
        ...mockCourseReview,
        rating: 2,
        reviewText: "Changed my mind.",
        tags: ["hard"],
      };
      repo.patchReview.mockResolvedValue(updated);
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send(patch);
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(2);
      expect(res.body.reviewText).toBe("Changed my mind.");
      expect(res.body.tags).toEqual(["hard"]);
    });

    test("censors profane reviewText in patch", async () => {
      const patch: ReviewPatchInputType = {
        reviewText: "This was a damn awful course",
      };
      repo.patchReview.mockResolvedValue(mockCourseReview);
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send(patch);
      expect(res.status).toBe(200);
      const calledWith = repo.patchReview.mock.calls[0]![1]!;
      expect(calledWith.reviewText).not.toBe(patch.reviewText);
    });

    test("patch with no fields succeeds", async () => {
      repo.patchReview.mockResolvedValue(mockCourseReview);
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send({});
      expect(res.status).toBe(200);
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app)
        .patch("/reviews/invalid-uuid")
        .send({ rating: 3 });
      expect(res.status).toBe(400);
    });

    test("rating out of range returns 400", async () => {
      mockValidate.mockReturnValue(true);
      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send({ rating: 10 });
      expect(res.status).toBe(400);
    });

    test("repository throws error returns 500", async () => {
      repo.patchReview.mockRejectedValue(new Error("DB error"));
      mockValidate.mockReturnValue(true);

      const res = await request(app)
        .patch(`/reviews/${mockCourseReview.reviewId}`)
        .send({ rating: 3 });
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /reviews/:id", () => {
    test("deletes review", async () => {
      repo.deleteReview.mockResolvedValue(undefined);
      mockValidate.mockReturnValue(true);

      const res = await request(app).delete(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(204);
      expect(repo.deleteReview).toHaveBeenCalledWith(mockCourseReview.reviewId);
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).delete("/reviews/invalid-uuid");
      expect(res.status).toBe(400);
    });

    test("repository throws error returns 500", async () => {
      repo.deleteReview.mockRejectedValue(new Error("DB error"));
      mockValidate.mockReturnValue(true);

      const res = await request(app).delete(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(500);
    });

    test("repository throws foreign key error returns 400", async () => {
      repo.deleteReview.mockRejectedValue(new Error("foreign key constraint"));
      mockValidate.mockReturnValue(true);

      const res = await request(app).delete(
        `/reviews/${mockCourseReview.reviewId}`,
      );
      expect(res.status).toBe(400);
    });
  });
});
