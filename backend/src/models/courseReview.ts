import { z } from "zod";

export interface CourseReview {
  reviewId: string;
  studentId: string;
  courseId: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CourseReviewPostInputSchema = z.object({
  studentId: z.string().uuid("studentId must be a valid UUID"),
  courseId: z.string().uuid("courseId must be a valid UUID"),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(2000),
});

export type CourseReviewPostInputType = z.infer<typeof CourseReviewPostInputSchema>;

export const CourseReviewPatchInputSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(1).max(2000).optional(),
});

export type CourseReviewPatchInputType = z.infer<typeof CourseReviewPatchInputSchema>;
