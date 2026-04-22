import { z } from "zod/v4";

export interface RMP {
    id: number;
    professorId: string;
    ratingAvg: string | null;
    ratingWta: number | null;
    avgDifficulty: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// add input types
export interface RMPPostInputType {
    professorId: string;
    ratingAvg: number | null;
    ratingWta: number | null;
    avgDifficulty: number | null;
}