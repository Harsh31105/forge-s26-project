import { z } from "zod";

export interface ProfThread {
    id: string;
    studentId: string;
    professorReviewId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export const ProfessorThreadPostInputSchema = z.object({
    studentId: z.string().uuid("studentId must be a valid UUID"),
    content: z.string().min(1).max(2000),
});
export type ProfessorThreadPostInputType = z.infer<typeof ProfessorThreadPostInputSchema>;

export const ProfessorThreadPatchInputSchema = z.object({
    content: z.string().min(1).max(2000),
});
export type ProfessorThreadPatchInputType = z.infer<typeof ProfessorThreadPatchInputSchema>;
