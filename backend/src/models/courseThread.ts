import { z } from "zod";

export interface CourseThread {
  id: string;
  studentId: string;
  courseReviewId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const threadContentSchema = z
  .string()
  .min(1, "content must be at least 1 character")
  .max(2000, "content must be at most 2000 characters");

export const CourseThreadPostInputSchema = z.object({
  studentId: z.string().uuid("studentId must be a valid UUID"),
  content: threadContentSchema,
});
export type CourseThreadPostInputType = z.infer<typeof CourseThreadPostInputSchema>;

export const CourseThreadPatchInputSchema = z.object({
  content: threadContentSchema,
});
export type CourseThreadPatchInputType = z.infer<typeof CourseThreadPatchInputSchema>;
