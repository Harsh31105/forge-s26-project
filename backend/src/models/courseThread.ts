import { z } from "zod";

export interface CourseThread {
  id: string;
  studentId: string;
  courseReviewId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CourseThreadPostInputSchema = z.object({
  studentId: z.string().uuid("studentId must be a valid UUID"),
  content: z.string().min(1).max(2000),
});
export type CourseThreadPostInputType = z.infer<typeof CourseThreadPostInputSchema>;

export const CourseThreadPatchInputSchema = z.object({
  content: z.string().min(1).max(2000),
});
export type CourseThreadPatchInputType = z.infer<typeof CourseThreadPatchInputSchema>;
