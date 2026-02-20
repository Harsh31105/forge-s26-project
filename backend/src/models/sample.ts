import { z } from "zod";

export interface Sample {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export const SamplePostInputSchema = z.object({
    name: z.string().min(1, "Name cannot be empty")
           .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
})
export type SamplePostInputType = z.infer<typeof SamplePostInputSchema>;

export const SamplePatchInputSchema = SamplePostInputSchema.partial();
export type SamplePatchInputType = z.infer<typeof SamplePatchInputSchema>
