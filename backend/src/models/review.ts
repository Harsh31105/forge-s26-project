import { z } from "zod";

// Shared fields
interface BaseReview {
  reviewId: string;
  studentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseReview extends BaseReview {
  courseId: string;
  tags?: string[] | undefined;
  rating: number;
  reviewText: string;
}

export interface ProfessorReview extends BaseReview {
  reviewId: string;
  professorId: string;
  tags?: string[] | undefined;
  rating: number;
  reviewText: string;
}

export type Review = CourseReview | ProfessorReview;

// Input schemas
export const ReviewPostInputSchema = z
  .object({
    studentId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(1, "Content cannot be empty").max(2000),
    courseId: z.uuid().optional().nullable(),
    professorId: z.uuid().optional().nullable(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !!data.courseId !== !!data.professorId,
    "Exactly one of courseId or professorId must be provided",
  );

export type ReviewPostInputType = z.infer<typeof ReviewPostInputSchema>;

export const ReviewPatchInputSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(1, "Content cannot be empty").max(2000).optional(),
  tags: z.array(z.string()).optional().nullable(),
});
export type ReviewPatchInputType = z.infer<typeof ReviewPatchInputSchema>;
