import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Sample, SamplePatchInputType, SamplePostInputType } from "../models/sample";
import { SampleRepositorySchema } from "./postgres/schema/samples";
import type { Professor, ProfessorPatchInputType, ProfessorPostInputType } from "../models/professor";
import { ProfessorRepositorySchema } from "./postgres/schema/professor";
import { PaginationType } from "../utils/pagination";

export class Repository {
    public readonly samples: SampleRepository;
    public readonly professors: ProfessorRepository;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;

    constructor(pool: Pool, db: NodePgDatabase) {
        this.pool = pool;
        this.db = db;
        this.samples = new SampleRepositorySchema(db);
        this.professors = new ProfessorRepositorySchema(db);
    }

    async getDB(): Promise<NodePgDatabase> {
        return this.db;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export interface SampleRepository {
    getSamples(pagination: PaginationType): Promise<Sample[]>;
    getSampleByID(id: string): Promise<Sample>;
    createSample(input: SamplePostInputType): Promise<Sample>;
    patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
    deleteSample(id: string): Promise<void>;
}

export interface ProfessorRepository {
    getProfessors(pagination: PaginationType): Promise<Professor[]>;
    getProfessorByID(id: string): Promise<Professor>;
    createProfessor(input: ProfessorPostInputType): Promise<Professor>;
    patchProfessor(id: string, input: ProfessorPatchInputType): Promise<Professor>;
    deleteProfessor(id: string): Promise<void>;
}