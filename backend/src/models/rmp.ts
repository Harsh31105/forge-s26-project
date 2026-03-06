import { z } from "zod/v4";

export interface RMP {
    id: number;
    professorId: string;
    ratingAvg: string | null;
    ratingWta: number | null;
    avgDifficulty: string;
    createdAt: Date;
    updatedAt: Date;
}

// post input
export const RMPPostInputSchema = z.object({
    professorId: z.string().uuid("professorId must be a valid UUID"),
    ratingAvg: z.number().min(1).max(5).nullable().optional(),
    ratingWta: z.number().int().min(0).max(100).nullable().optional(),
    avgDifficulty: z.number().min(1).max(5),
});

// no patch since we only need post rn

export type RMPPostInputType = z.infer<typeof RMPPostInputSchema>;