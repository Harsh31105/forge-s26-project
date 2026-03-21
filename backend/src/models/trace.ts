import { z } from "zod";

export interface Trace {
    id: string;
    courseId?: string;
    professorId?: string;
    departmentId?: number;
    action: string;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export const TracePostInputSchema = z.object({
    courseId: z.string().uuid().optional(),
    professorId: z.string().uuid().optional(),
    departmentId: z.number().int().optional(),
    action: z.string()
        .min(1, "Action cannot be empty")
        .refine((s) => s === s.trim(), "Action cannot have leading spaces"),
    timestamp: z.preprocess(
        (val) => (val ? new Date(val as string) : undefined),
        z.date()
    ),
});

export type TracePostInputType = z.infer<typeof TracePostInputSchema>;

export const TracePatchInputSchema = TracePostInputSchema.partial();
export type TracePatchInputType = z.infer<typeof TracePatchInputSchema>;