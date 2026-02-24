// professor.test.ts
// simple, get all professors?

// this test fakes the database using jest.fn()
// no docker needed for this

import request from "supertest";
import express, { type Express } from "express";
import { ProfessorHandler } from "../professor";
import type { ProfessorRepository } from "../../../storage/storage";
import type { Professor } from "../../../models/professor";
import { ProfessorPostInputType, ProfessorPatchInputType } from "../../../models/professor";
import { errorHandler } from "../../../errs/httpError";

// TODO: clarify do we need pagination for professor names?

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

describe("ProfessorHandler Endpoints", () => {
  let app: Express;
  let repo: jest.Mocked<ProfessorRepository>;
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

    handler = new ProfessorHandler(repo);

    app = express();
    app.use(express.json());

    app.get("/professors", (req, res, next) =>
      handler.handleGet(req, res).catch(next)
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

  // creates professor and returns 201
  // invalid body returns 400
  // repo error returns 500
  // empty patch -> should this be allowed

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
  // invalid body returns
  // repo error returns 500
  // empty patch -> should this be allowed?

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
  // deleting non-existent professor 

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
});