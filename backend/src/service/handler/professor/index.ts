import type { ProfessorRepository } from "../../../storage/storage";
import {
    Professor, ProfessorPatchInputSchema, ProfessorPatchInputType,
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
    constructor(private readonly repo: ProfessorRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
    const result = PaginationSchema.safeParse(req.query);
    if (Object.keys(result.data).length === 0) {
        throw BadRequest("patch body must contain at least one valid field");
    }
    if (!result.success) {
        throw BadRequest("Invalid pagination parameters");
    }
    const pagination = result.data;

    let professors: Professor[];
    try {
        professors = await this.repo.getProfessors(pagination);
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
            if (err instanceof NotFoundError) NotFound("professor not found");

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
        const patchProfessor: ProfessorPatchInputType = result.data;

        let updatedProfessor: Professor;
        try {
            updatedProfessor = await this.repo.patchProfessor(id, patchProfessor);
        } catch (err) {
            console.log(err);
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
            throw mapDBError(err, "failed to delete professor");
        }

        res.sendStatus(204);
    }
}