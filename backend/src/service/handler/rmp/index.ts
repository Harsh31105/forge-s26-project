import type { ProfessorRepository, RMPRepository } from "../../../storage/storage";
import { RMP } from "../../../models/rmp";
import { mapDBError } from "../../../errs/httpError";
import { Request, Response } from "express";
import { getNortheasternSchoolId } from "../../../rmp/rmpClient";
import { fetchAndMatchRMPData } from "../../../rmp/rmpHelper";

export class RMPHandler {

    // both rmp and professor repos to fetch & match before bulk inserting
    constructor(
        private readonly rmpRepo: RMPRepository,
        private readonly professorRepo: ProfessorRepository
    ) {}

    // POST /rmp - fetches from RMP API, matches to professors, bulk inserts
    async handlePost(req: Request, res: Response): Promise<void> {
        // get NEU RMP school ID
        const schoolId = await getNortheasternSchoolId();

        // get all professors from DB and fetch+match RMP data
        const professors = await this.professorRepo.getProfessors({ page: 1, limit: 1000 });
        const matched = await fetchAndMatchRMPData(professors, schoolId);

        // bulk insert
        let rmpData: RMP[];
        try {
            rmpData = await this.rmpRepo.postRMP(matched);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post RMP data");
        }

        res.status(201).json(rmpData);
    }
}
