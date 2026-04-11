import type { AcademicRepository } from "../../../storage/storage";
import { mapDBError } from "../../../errs/httpError";
import { Request, Response } from "express";

export class AcademicHandler {
    constructor(private readonly repo: AcademicRepository) {}

    async handleGetMajors(_req: Request, res: Response): Promise<void> {
        try {
            const majors = await this.repo.getMajors();
            res.status(200).json(majors);
        } catch (err) {
            console.error("Failed to get majors:", err);
            throw mapDBError(err, "Failed to retrieve majors");
        }
    }

    async handleGetConcentrations(_req: Request, res: Response): Promise<void> {
        try {
            const concentrations = await this.repo.getConcentrations();
            res.status(200).json(concentrations);
        } catch (err) {
            console.error("Failed to get concentrations:", err);
            throw mapDBError(err, "Failed to retrieve concentrations");
        }
    }

    async handleGetMinors(_req: Request, res: Response): Promise<void> {
        try {
            const minors = await this.repo.getMinors();
            res.status(200).json(minors);
        } catch (err) {
            console.error("Failed to get minors:", err);
            throw mapDBError(err, "Failed to retrieve minors");
        }
    }
}
