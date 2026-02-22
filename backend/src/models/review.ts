import { z } from "zod";

// Shared fields
interface BaseReview {
  id: string;
  studentId: string | null;
  rating: number;
  reviewText: string;
}

export interface CourseReview extends BaseReview {
  type: "course"; // discriminator
  courseId: string;
  tags?: string[] | undefined; // course tags
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessorReview extends BaseReview {
  type: "professor"; // discriminator
  profId: string;
  tags?: string[] | undefined; // professor tags
  createdAt: Date;
  updatedAt: Date;
}

export type Review = CourseReview | ProfessorReview;

// Input schemas
export const ReviewPostInputSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(1, "Content cannot be empty"),
    courseId: z.string().uuid().optional().nullable(),
    profId: z.string().uuid().optional().nullable(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !!data.courseId !== !!data.profId,
    "Exactly one of courseId or profId must be provided",
  );

export type ReviewPostInputType = z.infer<typeof ReviewPostInputSchema>;

export const ReviewPatchInputSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(1, "Content cannot be empty").optional(),
  tags: z.array(z.string()).optional(),
});
export type ReviewPatchInputType = z.infer<typeof ReviewPatchInputSchema>;
