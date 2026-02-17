import { z } from "zod";

export interface Review {
    id: string;
    rating: number;
    content: string;
    courseId: string | null;
    profId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export const ReviewPostInputSchema = z.object({
    rating: z.number().int().min(1).max(5),
    content: z.string().min(1, "Content cannot be empty"),
    courseId: z.string().min(1).optional().nullable(),
    profId: z.string().uuid().optional().nullable(),
}).refine(
    data => !!data.courseId !== !!data.profId,
    "Exactly one of courseId or profId must be provided"
);
export type ReviewPostInputType = z.infer<typeof ReviewPostInputSchema>;

export const ReviewPatchInputSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    content: z.string().min(1, "Content cannot be empty").optional(),
});
export type ReviewPatchInputType = z.infer<typeof ReviewPatchInputSchema>;
