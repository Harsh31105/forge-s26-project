import { z } from "zod";

export type SemesterType = "fall" | "spring" | "summer_1" | "summer_2";
export type LectureType = "lecture" | "lab" | "online";

export interface Trace {
    id: number;
    courseId: string;
    professorId: string;
    courseName: string;
    departmentId: number;
    courseCode: number;
    semester: SemesterType;
    lectureYear: number;
    lectureType: LectureType | null;
    eval: string | null;
    hoursDevoted: Record<string, number> | null;
    professorEfficiency: number | null;
    howOftenPercentage: Record<string, number> | null;
    createdAt: Date;
    updatedAt: Date;
}

export const TracePostInputSchema = z.object({
    courseId: z.string().uuid(),
    professorId: z.string().uuid(),
    courseName: z.string().min(1),
    departmentId: z.number().int(),
    courseCode: z.number().int(),
    semester: z.enum(["fall", "spring", "summer_1", "summer_2"]),
    lectureYear: z.number().int(),
    lectureType: z.enum(["lecture", "lab", "online"]).nullable().optional(),
    eval: z.string().nullable().optional(),
    hoursDevoted: z.record(z.string(), z.number()).nullable().optional(),
    professorEfficiency: z.number().nullable().optional(),
    howOftenPercentage: z.record(z.string(), z.number()).nullable().optional(),
});

export type TracePostInputType = z.infer<typeof TracePostInputSchema>;

export const TracePatchInputSchema = TracePostInputSchema.partial();
export type TracePatchInputType = z.infer<typeof TracePatchInputSchema>;
