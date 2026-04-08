import { z } from "zod";
import { LectureType } from "./course";

export type Semester = "fall" | "spring" | "summer_1" | "summer_2";

export type AcademicSemester = {
  semester: Semester;
  year: number;
};

export interface Trace {
  id: number;
  courseId: string;
  professorId: string;
  courseName: string;
  departmentId: number;
  courseCode: number;
  semester: Semester;
  lectureYear: number;
  lectureType: LectureType | null;
  hoursDevoted: Record<string, number> | null;
  professorEfficiency: number | null;
  howOftenPercentage: Record<string, number> | null;
  eval: string | null;
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
export const TraceFilterSchema = z.object({
  courseId: z.uuid().optional(),
  professorId: z.uuid().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  semester: z.enum(["fall", "spring", "summer_1", "summer_2"]).optional(),
});
export type TraceFilterType = z.infer<typeof TraceFilterSchema>;

export const OfferHistoryFilterSchema = z.object({
  courseId: z.uuid().optional(),
  professorId: z.uuid().optional(),
});
export type OfferHistoryFilterType = z.infer<typeof OfferHistoryFilterSchema>;
