import { z } from "zod";

export interface student {
    id: string;
    first_name: string;
    last_name: string,
    email: string,
    graduation_year: number,
    preferences : string,
    createdAt: Date;
    updatedAt: Date;
}

// GET
export const StudentGetInputSchema = z.object({
    id: z.string().uuid("id must be a valid UUID"),
    first_name: z.string.min(1, "first name must be a string"),
    last_name: z.string(1, "last name must be a stringf"),
    email: z.string(1, "email must be a string"),
    graduation_year: z.number().int().min(1900).max(3000),
    preferences: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type StudentsGetInputType = z.infer<typeof StudentGetInputSchema>;

// POST
export const StudentPostInputSchema = StudentGetInputSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type StudentPostInputType = z.infer<typeof StudentPostInputSchema>

// PATCH
export const StudentIdPatchInputSchema = StudentPostInputSchema.partical();
export type StudentIdPatchInputType = z.infer<typeof StudentIdPatchInputSchema>


// DELETE
export const StudentIdDeleteInputSchema = z.object({
    id: z.string().uuid(),
});
export type StudentIdDeleteInputType = z.infer<typeof StudentIdDeleteInputSchema>

