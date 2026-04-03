import { z } from "zod";
import {LectureType} from "./course";

export type Semester = "fall" | "spring" | "summer_1" | "summer_2";

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
    howOftenPercentage: number;
    hoursDevoted: number;
    professorEfficiency: string;
    eval: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export const TraceFilterSchema = z.object({
    courseId: z.uuid().optional(),
    professorId: z.uuid().optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    semester: z.enum(["fall", "spring", "summer_1", "summer_2"]).optional()
});
export type TraceFilterType = z.infer<typeof TraceFilterSchema>;