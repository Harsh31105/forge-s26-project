import { z } from "zod";
export interface Sample {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SamplePostInputSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export type SamplePostInputType = z.infer<typeof SamplePostInputSchema>;
export declare const SamplePatchInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SamplePatchInputType = z.infer<typeof SamplePatchInputSchema>;
//# sourceMappingURL=sample.d.ts.map