import { z } from "zod";

export interface Sample {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export const SamplePostInput = z.object({
    name: z.string().min(1, "Name cannot be empty")
           .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
})
export type SamplePostInput = z.infer<typeof SamplePostInput>;

export const SamplePatchInput = SamplePostInput.partial();
export type SamplePatchInput = z.infer<typeof SamplePatchInput>