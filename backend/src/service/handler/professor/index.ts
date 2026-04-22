import type { ProfessorRepository, RMPRepository } from "../../../storage/storage";
import type { RMP } from "../../../models/rmp";
import {
    Professor, ProfessorFilterSchema, ProfessorPatchInputSchema, ProfessorPatchInputType,
    ProfessorPostInputSchema,
    ProfessorPostInputType
} from "../../../models/professor";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import { PaginationSchema } from "../../../utils/pagination";

export class ProfessorHandler {
    constructor(
        private readonly repo: ProfessorRepository,
        private readonly rmpRepo: RMPRepository
    ) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const paginationResult = PaginationSchema.safeParse(req.query);
        if (!paginationResult.success) {
            throw BadRequest("Invalid pagination parameters");
        }
        const pagination = paginationResult.data;

        const filterResult = ProfessorFilterSchema.safeParse(req.query);
        if (!filterResult.success) {
            throw BadRequest("Invalid filter parameters");
        }
        const filters = filterResult.data;

        let professors: Professor[];
        try {
            professors = await this.repo.getProfessors(pagination, filters);
        } catch (err) {
            console.log("Failed to get professors: ", err);
            throw mapDBError(err, "failed to retrieve professors");
        }

        res.status(200).json(professors);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        let professor: Professor;
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("Empty ID cannot be given");

        try {
            professor = await this.repo.getProfessorByID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("professor not found");
            throw mapDBError(err, "failed to retrieve professor");
        }

        res.status(200).json(professor);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const result = ProfessorPostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for post-professor");
        }
        const postProfessor: ProfessorPostInputType = result.data;

        let newProfessor: Professor;
        try {
            newProfessor = await this.repo.createProfessor(postProfessor);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post professor");
        }

        res.status(201).json(newProfessor);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        const result = ProfessorPatchInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for patch-professor");
        }

        if (Object.keys(result.data).length === 0) {
            throw BadRequest("patch body must contain at least one valid field");
        }

        const patchProfessor: ProfessorPatchInputType = result.data;

        let updatedProfessor: Professor;
        try {
            updatedProfessor = await this.repo.patchProfessor(id, patchProfessor);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("professor not found");
            throw mapDBError(err, "failed to patch professor");
        }

        res.status(200).json(updatedProfessor);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteProfessor(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) throw NotFound("professor not found");
            throw mapDBError(err, "failed to delete professor");
        }

        res.sendStatus(204);
    }

    // GET /professors/:id/rmp - get RMP data for a professor
    // revert back to default null object
    async handleGetRMP(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid professor ID was given");

        let rmpData: RMP | null;
        try {
            rmpData = await this.rmpRepo.getRMPByProfessorID(id);
        } catch (err) {
            console.log(err);
            // if (err instanceof NotFoundError) {
            //     res.status(200).json({
            //         professorId: id,
            //         ratingAvg: null,
            //         ratingWta: null,
            //         avgDifficulty: null,
            //     });
            //     return;
            // }
            throw mapDBError(err, "failed to retrieve RMP data");
        }

        res.status(200).json(rmpData);
    }
}