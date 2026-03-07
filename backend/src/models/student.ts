import { z } from "zod";

export type StudentPreference =
    | "exam-heavy"
    | "project-heavy"
    | "group-work"
    | "attendance-required"
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
    "strict_deadlines",
    "flexible_deadlines",
    "extra_credit",
    "little_to_no_test",
    "fast_paced",
    "slow_paced",
]);

export interface Major {
    id: number;
    name: string;
}

export interface Minor {
    id: number;
    name: string;
}

export interface Concentration {
    id: number;
    name: string;
}

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    graduationYear: number | null;
    preferences: string[] | null;
    majors?: Major[]; // optional
    concentrations?: Concentration[]; // optional
    minors?: Minor[]; // optional
    createdAt: Date;
    updatedAt: Date;
}

// POST
export const StudentPostInputSchema = z.object({
    firstName: z.string().min(1, "first name must not be empty"),
    lastName: z.string().min(1, "last name must not be empty"),
    email: z.string().email("must be a valid email"),
    graduationYear: z.number().optional(),
    preferences: z.array(StudentPreferenceEnum).optional(),
});
export type StudentPostInputType = z.infer<typeof StudentPostInputSchema>;

// PATCH
export const StudentPatchInputSchema = StudentPostInputSchema.partial();
export type StudentPatchInputType = z.infer<typeof StudentPatchInputSchema>;