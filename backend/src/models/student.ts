import { z } from "zod";

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

export type StudentPreference = z.infer<typeof StudentPreferenceEnum>;

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
    preferences: StudentPreference[];
    profilePictureKey?: string | null;
    majors?: Major[];
    concentrations?: Concentration[];
    minors?: Minor[];
    createdAt: Date;
    updatedAt: Date;
}

// Bridge table POST
export const StudentMajorPostInputSchema = z.object({
    majorId: z.number().int().positive(),
});

export type StudentMajorPostInputType = z.infer<typeof StudentMajorPostInputSchema>;

export const StudentConcentrationPostInputSchema = z.object({
    concentrationId: z.number().int().positive(),
});

export type StudentConcentrationPostInputType = z.infer<typeof StudentConcentrationPostInputSchema>;

export const StudentMinorPostInputSchema = z.object({
    minorId: z.number().int().positive(),
});

export type StudentMinorPostInputType = z.infer<typeof StudentMinorPostInputSchema>;

// POST
export const StudentPostInputSchema = z.object({
    firstName: z.string().min(1, "first name must not be empty"),
    lastName: z.string().min(1, "last name must not be empty"),
    email: z.string().email("must be a valid email"),
    graduationYear: z.number().optional(),
    preferences: z.array(StudentPreferenceEnum).optional(),
});
export type StudentPostInputType = z.infer<typeof StudentPostInputSchema>;

// PATCH — uses z.preprocess to coerce multipart/form-data strings (all fields arrive as strings)
export const StudentPatchInputSchema = z.object({
    firstName: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().min(1, "first name must not be empty").optional(),
    ),
    lastName: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().min(1, "last name must not be empty").optional(),
    ),
    email: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().email("must be a valid email").optional(),
    ),
    graduationYear: z.preprocess(
        (val) => {
            if (val === "" || val === "0" || val === 0) return undefined;
            if (typeof val === "string") return Number(val);
            return val;
        },
        z.number().int().positive().optional(),
    ),
    preferences: z.preprocess(
        (val) => {
            if (val === "" || val === undefined) return undefined;
            if (typeof val === "string") return [val];
            return val;
        },
        z.array(StudentPreferenceEnum).optional(),
    ),
    profilePictureKey: z.string().nullable().optional(),
});
export type StudentPatchInputType = z.infer<typeof StudentPatchInputSchema>;