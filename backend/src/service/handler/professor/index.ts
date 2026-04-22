import type { ProfessorRepository, ProfessorReviewRepository, RMPRepository, TraceRepository } from "../../../storage/storage";
import type { ProfessorAvatarRepository } from "../../../storage/s3/professorAvatars";
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
        private readonly rmpRepo: RMPRepository,
        private readonly profReviewsRepo: ProfessorReviewRepository,
        private readonly tracesRepo: TraceRepository,
        private readonly avatarRepo: ProfessorAvatarRepository,
    ) {}

    private async withPresignedAvatar(professor: Professor): Promise<Professor> {
        if (!professor.avatar) return professor;
        const url = await this.avatarRepo.getPresignedUrl(professor.avatar);
        return { ...professor, avatar: url };
    }

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

        const withAvatars = await Promise.all(professors.map(p => this.withPresignedAvatar(p)));
        res.status(200).json(withAvatars);
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

        res.status(200).json(await this.withPresignedAvatar(professor));
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

    // GET /professors/:id/top-tags - get top 3 most used tags for a professor
    async handleGetTopTags(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid professor ID was given");

        const topTags = await this.profReviewsRepo.getTopTagsByProfessorId(id);
        res.status(200).json(topTags);
    }

    // GET /professors/:id/ratings - get NorthStar + TRACE ratings for a professor
    async handleGetRatings(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid professor ID was given");

        const [northstar, traceRows] = await Promise.all([
            this.profReviewsRepo.getRatingsByProfessorId(id),
            this.tracesRepo.getTraces({ limit: 10000, page: 1 }, { professorId: id }),
        ]);

        const traceEfficiencies = traceRows
            .map(t => parseFloat(t.professorEfficiency))
            .filter(v => !isNaN(v));

        const traceAverage = traceEfficiencies.length > 0
            ? traceEfficiencies.reduce((sum, v) => sum + v, 0) / traceEfficiencies.length
            : null;

        res.status(200).json({
            northstar: {
                averageRating: northstar.averageRating,
                totalRatings: northstar.totalRatings,
            },
            trace: {
                averageEfficiency: traceAverage,
                totalTraceRows: traceEfficiencies.length,
            },
        });
    }

    // GET /professors/:id/rmp - get RMP data for a professor
    // revert back to default null object
    async handleGetRMP(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid professor ID was given");

        let rmpData: RMP;
        try {
            rmpData = await this.rmpRepo.getRMPByProfessorID(id);
        } catch (err) {
            console.log(err);
            if (err instanceof NotFoundError) {
                res.status(200).json({
                    professorId: id,
                    ratingAvg: null,
                    ratingWta: null,
                    avgDifficulty: null,
                });
                return;
            }
            throw mapDBError(err, "failed to retrieve RMP data");
        }

        res.status(200).json(rmpData);
    }
}