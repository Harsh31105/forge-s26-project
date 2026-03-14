import { z } from "zod";

export interface Trace {
    id: string;
    courseId: string; // optional
    professorId: string; // optional
    departmentId: string; // optional
    action: string;
    timestamp: Date;
}

export const TracePostInputSchema = z.object({
    courseId: z.string().optional(),
    professorId: z.string().optional(),
    departmentId: z.string().optional(),
    action: z.string().min(1, "Action cannot be empty")
        .refine((s) => s === s.trim(), "Action cannot have leading  spaces"),
    timestamp: z.preprocess((val) => val ? new Date(val as string) : undefined,
        z.date())
});
export type TracePostInputType = z.infer<typeof TracePostInputSchema>;

export const TracePatchInputSchema = TracePostInputSchema.partial();
export type TracePatchInputType = z.infer<typeof TracePatchInputSchema>;