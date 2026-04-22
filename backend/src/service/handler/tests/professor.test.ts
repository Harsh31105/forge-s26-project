// professor.test.ts
// this test fakes the database using jest.fn()
// no docker needed for this

import request from "supertest";
import express, { type Express } from "express";
import { ProfessorHandler } from "../professor";
import type { ProfessorRepository, RMPRepository, ProfessorReviewRepository, TraceRepository } from "../../../storage/storage";
import type { ProfessorAvatarRepository } from "../../../storage/s3/professorAvatars";
import type { Professor } from "../../../models/professor";
// import { ProfessorPostInputType, ProfessorPatchInputType } from "../../../models/professor";
import type { RMP } from "../../../models/rmp";
import { errorHandler, NotFoundError } from "../../../errs/httpError";

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

const mockRMP: RMP = {
  id: 1,
  professorId: "11111111-1111-1111-1111-111111111111",
  ratingAvg: "4.50",
  ratingWta: 85,
  avgDifficulty: "3.20",
  createdAt: new Date("2026-01-15T10:30:00Z"),
  updatedAt: new Date("2026-01-15T10:30:00Z"),
};

describe("ProfessorHandler Endpoints", () => {
  let app: Express;
  let repo: jest.Mocked<ProfessorRepository>;
  let rmpRepo: jest.Mocked<RMPRepository>;
  let profReviewsRepo: jest.Mocked<ProfessorReviewRepository>;
  let tracesRepo: jest.Mocked<TraceRepository>;
  let avatarRepo: jest.Mocked<ProfessorAvatarRepository>;
  let handler: ProfessorHandler;

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockValidate.mockReturnValue(true);

    repo = {
      getProfessors: jest.fn(),
      getProfessorByID: jest.fn(),
      createProfessor: jest.fn(),
      patchProfessor: jest.fn(),
      deleteProfessor: jest.fn(),
    } as unknown as jest.Mocked<ProfessorRepository>;

    rmpRepo = {
        getRMPByProfessorID: jest.fn(),
        postRMP: jest.fn(),
    } as unknown as jest.Mocked<RMPRepository>;

    profReviewsRepo = {
        getTopTagsByProfessorId: jest.fn().mockResolvedValue([]),
        getRatingsByProfessorId: jest.fn().mockResolvedValue({ averageRating: null, totalRatings: 0 }),
    } as unknown as jest.Mocked<ProfessorReviewRepository>;

    tracesRepo = {
        getTraces: jest.fn().mockResolvedValue([]),
        getOfferHistory: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<TraceRepository>;

    avatarRepo = {
        getRandomAvatarKey: jest.fn().mockReturnValue("professor-avatars/1.png"),
        getPresignedUrl: jest.fn().mockResolvedValue("https://s3.example.com/professor-avatars/1.png"),
    } as unknown as jest.Mocked<ProfessorAvatarRepository>;

    handler = new ProfessorHandler(repo, rmpRepo, profReviewsRepo, tracesRepo, avatarRepo);

    app = express();
    app.use(express.json());

    app.get("/professors", (req, res, next) =>
      handler.handleGet(req, res).catch(next)
    );
    app.get("/professors/:id/rmp", (req, res, next) =>
      handler.handleGetRMP(req, res).catch(next)
    );
    app.get("/professors/:id", (req, res, next) =>
      handler.handleGetByID(req, res).catch(next)
    );
    app.post("/professors", (req, res, next) =>
      handler.handlePost(req, res).catch(next)
    );
    app.patch("/professors/:id", (req, res, next) =>
      handler.handlePatch(req, res).catch(next)
    );
    app.delete("/professors/:id", (req, res, next) =>
      handler.handleDelete(req, res).catch(next)
    );
    app.get("/professors/:id/top-tags", (req, res, next) =>
      handler.handleGetTopTags(req, res).catch(next)
    );
    app.get("/professors/:id/ratings", (req, res, next) =>
      handler.handleGetRatings(req, res).catch(next)
    );

    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockValidate.mockReturnValue(true);
  });

  // get/professors 
  // return all profs
  // repo error returns 500
  // returns empty arr when no profs exist
  // invalid pagination params returns 400

  describe("GET /professors", () => {
    test("returns all professors", async () => {
      const data: Professor[] = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          firstName: "John",
          lastName: "Doe",
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Professor,
      ];
      repo.getProfessors.mockResolvedValue(data);

      const res = await request(app).get("/professors");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(data.map((p) => toJsonDates(p)));
    });

    test("repo error returns 500", async () => {
      repo.getProfessors.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/professors");
      expect(res.status).toBe(500);
    });

    test("returns empty array when no professors exist", async () => {
      repo.getProfessors.mockResolvedValue([]);
      const res = await request(app).get("/professors");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("invalid pagination params returns 400", async () => {
      const res = await request(app).get("/professors?page=-1");
      expect(res.status).toBe(400);
    });

    // filtering tests

    test("filter by firstName", async () => {
    const data: Professor[] = [{
        id: "11111111-1111-1111-1111-111111111111",
        firstName: "John",
        lastName: "Doe",
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Professor];
    repo.getProfessors.mockResolvedValue(data);
    const res = await request(app).get("/professors?firstName=John");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].firstName).toBe("John");
});

    test("filter by lastName", async () => {
        const data: Professor[] = [{
            id: "11111111-1111-1111-1111-111111111111",
            firstName: "John",
            lastName: "Doe",
            tags: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Professor];
        repo.getProfessors.mockResolvedValue(data);
        const res = await request(app).get("/professors?lastName=Doe");
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].lastName).toBe("Doe");
    });

    test("sort by firstName desc", async () => {
        const data: Professor[] = [{
            id: "11111111-1111-1111-1111-111111111111",
            firstName: "Zach",
            lastName: "Smith",
            tags: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Professor];
        repo.getProfessors.mockResolvedValue(data);
        const res = await request(app).get("/professors?sortBy=firstName&sortOrder=desc");
        expect(res.status).toBe(200);
        expect(res.body[0].firstName).toBe("Zach");
    });

    test("invalid sortOrder returns 400", async () => {
        const res = await request(app).get("/professors?sortOrder=invalid");
        expect(res.status).toBe(400);
    });
  });

  // get professors id
  // returns professor by ID
  // invalid uuid -> 400
  // repo error -> 500 
  // prof not found returns 404, not testing notfounderror

  describe("GET /professors/:id", () => {
    test("returns professor by ID", async () => {
      const professor: Professor = {
        id: "11111111-1111-1111-1111-111111111111",
        firstName: "John",
        lastName: "Doe",
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Professor;
      repo.getProfessorByID.mockResolvedValue(professor);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(toJsonDates(professor));
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).get("/professors/not-a-uuid");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      repo.getProfessorByID.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /professors/:id/rmp", () => {
    test("returns RMP data for a professor", async () => {
      rmpRepo.getRMPByProfessorID.mockResolvedValue(mockRMP);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 1,
        professorId: "11111111-1111-1111-1111-111111111111",
        ratingAvg: "4.50",
        ratingWta: 85,
        avgDifficulty: "3.20",
      });
      expect(rmpRepo.getRMPByProfessorID).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111"
      );
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).get("/professors/not-a-uuid/rmp");
      expect(res.status).toBe(400);
    });

    test("professor has no RMP data returns 200 with null values", async () => {
      rmpRepo.getRMPByProfessorID.mockRejectedValue(
          new NotFoundError("RMP data not found for given professor ID")
      );
      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
          professorId: "11111111-1111-1111-1111-111111111111",
          ratingAvg: null,
          ratingWta: null,
          avgDifficulty: null,
      });
    });

    test("repo error returns 500", async () => {
      rmpRepo.getRMPByProfessorID.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/rmp");
      expect(res.status).toBe(500);
    });
  });


  // creates professor and returns 201
  // invalid body returns 400
  // repo error returns 500

  describe("POST /professors", () => {
    test("creates a professor and returns 201", async () => {
      const created: Professor = {
        id: "11111111-1111-1111-1111-111111111111",
        firstName: "Jane",
        lastName: "Smith",
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Professor;
      repo.createProfessor.mockResolvedValue(created);

      const res = await request(app)
        .post("/professors")
        .send({ firstName: "Jane", lastName: "Smith" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(toJsonDates(created));
      expect(repo.createProfessor).toHaveBeenCalledWith({ firstName: "Jane", lastName: "Smith" });
    });

    test("invalid body returns 400", async () => {
      const res = await request(app).post("/professors").send({ bad: "payload" });
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      repo.createProfessor.mockRejectedValue(new Error("DB error"));
      const res = await request(app)
        .post("/professors")
        .send({ firstName: "Jane", lastName: "Smith" });
      expect(res.status).toBe(500);
    });
  });

  // updates a professor
  // invalid uuid returns 400
  // invalid body returns 400
  // repo error returns 500
  // empty patch body returns 400

  describe("PATCH /professors/:id", () => {
    test("updates a professor", async () => {
      const updated: Professor = {
        id: "11111111-1111-1111-1111-111111111111",
        firstName: "Updated",
        lastName: "Doe",
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Professor;
      repo.patchProfessor.mockResolvedValue(updated);

      const res = await request(app)
        .patch("/professors/11111111-1111-1111-1111-111111111111")
        .send({ firstName: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(toJsonDates(updated));
      expect(repo.patchProfessor).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        { firstName: "Updated" }
      );
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app)
        .patch("/professors/not-a-uuid")
        .send({ firstName: "x" });
      expect(res.status).toBe(400);
    });

    test("invalid body returns 400", async () => {
      const res = await request(app)
        .patch("/professors/11111111-1111-1111-1111-111111111111")
        .send({ nope: true });
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      repo.patchProfessor.mockRejectedValue(new Error("DB error"));
      const res = await request(app)
        .patch("/professors/11111111-1111-1111-1111-111111111111")
        .send({ firstName: "x" });
      expect(res.status).toBe(500);
    });
  });

  // deletes professor
  // invalid uuid -> returns 400
  // repo error returns 500

  describe("DELETE /professors/:id", () => {
    test("deletes a professor", async () => {
      repo.deleteProfessor.mockResolvedValue(undefined);

      const res = await request(app).delete("/professors/11111111-1111-1111-1111-111111111111");
      expect(res.status).toBe(204);
      expect(repo.deleteProfessor).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).delete("/professors/not-a-uuid");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      repo.deleteProfessor.mockRejectedValue(new Error("DB error"));
      const res = await request(app).delete("/professors/11111111-1111-1111-1111-111111111111");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /professors/:id/top-tags", () => {
    test("returns top tags for a professor", async () => {
      const tags = [
        { tag: "engaging", count: 5 },
        { tag: "clear", count: 3 },
        { tag: "helpful", count: 2 },
      ];
      profReviewsRepo.getTopTagsByProfessorId.mockResolvedValue(tags);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/top-tags");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(tags);
      expect(profReviewsRepo.getTopTagsByProfessorId).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111"
      );
    });

    test("returns empty array when professor has no reviews", async () => {
      profReviewsRepo.getTopTagsByProfessorId.mockResolvedValue([]);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/top-tags");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).get("/professors/not-a-uuid/top-tags");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      profReviewsRepo.getTopTagsByProfessorId.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/top-tags");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /professors/:id/ratings", () => {
    test("returns northstar and trace ratings for a professor", async () => {
      profReviewsRepo.getRatingsByProfessorId.mockResolvedValue({
        averageRating: 4.2,
        totalRatings: 10,
      });
      tracesRepo.getTraces.mockResolvedValue([
        { professorEfficiency: "4.0" } as any,
        { professorEfficiency: "4.5" } as any,
      ]);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/ratings");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        northstar: { averageRating: 4.2, totalRatings: 10 },
        trace: { averageEfficiency: 4.25, totalTraceRows: 2 },
      });
    });

    test("returns null trace average when no trace data exists", async () => {
      profReviewsRepo.getRatingsByProfessorId.mockResolvedValue({
        averageRating: 3.8,
        totalRatings: 5,
      });
      tracesRepo.getTraces.mockResolvedValue([]);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/ratings");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        northstar: { averageRating: 3.8, totalRatings: 5 },
        trace: { averageEfficiency: null, totalTraceRows: 0 },
      });
    });

    test("returns null northstar average when professor has no reviews", async () => {
      profReviewsRepo.getRatingsByProfessorId.mockResolvedValue({
        averageRating: null,
        totalRatings: 0,
      });
      tracesRepo.getTraces.mockResolvedValue([]);

      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/ratings");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        northstar: { averageRating: null, totalRatings: 0 },
        trace: { averageEfficiency: null, totalTraceRows: 0 },
      });
    });

    test("invalid UUID returns 400", async () => {
      mockValidate.mockReturnValue(false);
      const res = await request(app).get("/professors/not-a-uuid/ratings");
      expect(res.status).toBe(400);
    });

    test("repo error returns 500", async () => {
      profReviewsRepo.getRatingsByProfessorId.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/professors/11111111-1111-1111-1111-111111111111/ratings");
      expect(res.status).toBe(500);
    });
  });
});