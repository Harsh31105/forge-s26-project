import { z } from "zod";

export interface Department {
    id: number;
    name: string;
}

export enum LectureType {
    LECTURE = "lecture",
    LAB = "lab",
    ONLINE = "online",
}

export interface Course {
    id: string;
    name: string;
    department: Department;
    course_code: number;
    description: string;
    num_credits: number;
    lecture_type: LectureType;
    created_at: Date;
    updated_at: Date;
}

export const CoursePostInputSchema = z.object({
    name: z.string().min(1).max(2000).refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
    department_id: z.number(),
    course_code: z.number().min(1000).max(10000),
    description: z.string(),
    num_credits: z.number().min(1).max(6),
    lecture_type: z.nativeEnum(LectureType)
});

export type CoursePostInputType = z.infer<typeof CoursePostInputSchema>;

export const CoursePatchInputSchema = CoursePostInputSchema.partial();
export type CoursePatchInputType = z.infer<typeof CoursePatchInputSchema>