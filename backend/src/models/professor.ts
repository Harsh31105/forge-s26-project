import { z } from "zod";

export type LocationTag =
    | "boston"
    | "oakland"
    | "london";

export type ProfessorTag =
    | "clear_lectures" | "confusing_lectures"
    | "organized" | "disorganized"
    | "engaging" | "boring"
    | "reads_slides"
    | "fair_grading" | "tough_grader" | "lenient_grader"
    | "unclear_rubrics"
    | "curve_based" | "no_curve"
    | "tricky_exams" | "straightforward_exams"
    | "heavy_workload" | "manageable_workload"
    | "busywork"
    | "high_expectations" | "low_expectations"
    | "approachable" | "unapproachable"
    | "responsive" | "slow_responder"
    | "caring" | "intimidating"
    | "passionate" | "monotone"
    | "attendance_required" | "attendance_optional"
    | "strict_deadlines" | "flexible_deadlines"
    | "extra_credit" | "no_extra_credit"
    | "little_to_no_test";

export interface Professor {
    id: string;
    firstName: string;
    lastName: string;
    tags: LocationTag[] | null;
    createdAt: Date;
    updatedAt: Date;
}

export const ProfessorPostInputSchema = z.object({
    firstName: z.string().min(1, "First name can't be empty")
        .refine((s) => s === s.trim(), "First name can't have leading or trailing spaces"),
    lastName: z.string().min(1, "Last name can't be empty")
        .refine((s) => s === s.trim(), "Last name can't have leading or trailing spaces"),
    tags: z.array(z.string()).optional(),
});

export type ProfessorPostInputType = z.infer<typeof ProfessorPostInputSchema>;

export const ProfessorPatchInputSchema = ProfessorPostInputSchema.partial();
export type ProfessorPatchInputType = z.infer<typeof ProfessorPatchInputSchema>;