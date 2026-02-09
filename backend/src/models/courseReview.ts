import { z } from "zod";
import { validate as isUUID } from "uuid";


export interface CourseReview {
    id: String;
    courseId: String;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export const CourseReviewPostInputSchema = z.object({
    courseId: z.coerce.string().refine(isUUID, {
        message: "courseId must be a valid UUID",}),
    rating: z
        .number()
        .int("rating must be an integer")
        .min(1, "rating must be at least 1")
        .max(5, "rating must be at most 5"),
    comment: z
        .string()
        .refine((s) => s === s.trim(), "comment cannot have leading/trailing spaces")
    .optional(),

});

export type CourseReviewPostInputType = z.infer<typeof CourseReviewPostInputSchema>;

export const CourseReviewPatchInputSchema = CourseReviewPostInputSchema.partial();
export type CourseReviewPatchInputType = z.infer<typeof CourseReviewPatchInputSchema>;