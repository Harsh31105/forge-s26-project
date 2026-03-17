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

export const professorTags = [
  "clear_lectures", "confusing_lectures", "organized", "disorganized",
  "engaging", "boring", "reads_slides", "fair_grading", "tough_grader",
  "lenient_grader", "unclear_rubrics", "curve_based", "no_curve",
  "tricky_exams", "straightforward_exams", "heavy_workload",
  "manageable_workload", "busywork", "high_expectations", "low_expectations",
  "approachable", "unapproachable", "responsive", "slow_responder", "caring",
  "intimidating", "passionate", "monotone", "attendance_required",
  "attendance_optional", "strict_deadlines", "flexible_deadlines",
  "extra_credit", "no_extra_credit", "little_to_no_test",
] as const;

export const courseTags = [
  "easy_a", "challenging", "fast_paced", "slow_paced", "time_consuming",
  "exam_heavy", "project_heavy", "quiz_heavy", "participation_based",
  "presentation_heavy", "coding_heavy", "math_heavy", "reading_heavy",
  "writing_heavy", "group_projects", "solo_projects", "well_structured",
  "poorly_structured", "lecture_based", "discussion_based", "lab_required",
  "mandatory_attendance", "optional_attendance", "mandatory_textbook",
  "no_textbook",
] as const;

// Input schemas
export const ReviewPostInputSchema = z
  .object({
    studentId: z.uuid().optional(),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(1, "Content cannot be empty").max(2000),
    courseId: z.uuid().optional().nullable(),
    professorId: z.uuid().optional().nullable(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !!data.courseId !== !!data.professorId,
    "Exactly one of courseId or professorId must be provided",
  )
  .refine(
    (data) => {
      if (!data.tags) return true;
      if (data.courseId) return data.tags.every((t) => (courseTags as readonly string[]).includes(t));
      if (data.professorId) return data.tags.every((t) => (professorTags as readonly string[]).includes(t));
      return true;
    },
    { message: "Invalid tags for this review type", path: ["tags"] },
  );

export type ReviewPostInputType = z.infer<typeof ReviewPostInputSchema>;

export const ReviewPatchInputSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(1, "Content cannot be empty").max(2000).optional(),
  tags: z.array(z.string()).optional().nullable(),
});
export type ReviewPatchInputType = z.infer<typeof ReviewPatchInputSchema>;
