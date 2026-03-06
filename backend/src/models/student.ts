import { z } from "zod";

export type StudentPreference =
    | "exam-heavy"
    | "project-heavy"
    | "group-work"
    | "attendance-required"
    | "morning-classes"
    | "afternoon-classes"
    | "evening-classes"
    | "strict_deadlines"
    | "flexible_deadlines"
    | "extra_credit"
    | "little_to_no_test"
    | "fast_paced"
    | "slow_paced";

export const StudentPreferenceEnum = z.enum([
    "exam-heavy",
    "project-heavy",
    "group-work",
    "attendance-required",
    "morning-classes",
    "afternoon-classes",
    "evening-classes",
    "strict_deadlines",
    "flexible_deadlines",
    "extra_credit",
    "little_to_no_test",
    "fast_paced",
    "slow_paced",
]);

export interface Major {
    id: string;
    name: string;
}

export interface Minor {
    id: string;
    name: string;
}

export interface Concentration {
    id: string;
    name: string;
}

export interface Student {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    graduation_year: number;
    preferences: string[];
    majors: Major[];
    concentrations: Concentration[];
    minors: Minor[];
    createdAt: Date;
    updatedAt: Date;
}

// GET
export const StudentGetInputSchema = z.object({
    id: z.string().uuid("id must be a valid UUID"),
});
export type StudentGetInputType = z.infer<typeof StudentGetInputSchema>;

// POST
export const StudentPostInputSchema = z.object({
    first_name: z.string().min(1, "first name must not be empty"),
    last_name: z.string().min(1, "last name must not be empty"),
    email: z.string().email("must be a valid email"),
    graduation_year: z.number().int().min(1900).max(3000),
    preferences: z.array(StudentPreferenceEnum),
});
export type StudentPostInputType = z.infer<typeof StudentPostInputSchema>;

// PATCH
export const StudentPatchInputSchema = StudentPostInputSchema.partial();
export type StudentPatchInputType = z.infer<typeof StudentPatchInputSchema>;

// DELETE
export const StudentDeleteInputSchema = z.object({
    id: z.string().uuid(),
});
export type StudentDeleteInputType = z.infer<typeof StudentDeleteInputSchema>;