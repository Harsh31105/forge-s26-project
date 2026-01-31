import { z } from "zod";

export interface Sample {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export const SamplePostInputSchema = z.object({
    name: z.string().min(1, "Name cannot be empty")
           .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
})
export type SamplePostInputType = z.infer<typeof SamplePostInput>;

export const SamplePatchInputSchema = SamplePostInput.partial();
export type SamplePatchInputType = z.infer<typeof SamplePatchInput>