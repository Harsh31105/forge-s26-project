import { z } from "zod";

export interface Department {
    id: number;
    name: string;
}

export type LectureType = "lecture" | "lab" | "online"; 

export interface Course {
    id: string;
    name: string;
    department: Department;
    course_code: number;
    description: string;
    num_credits: number;
    lecture_type: LectureType | null;
    prereqs: string | null;
    coreqs: string | null;
    nupath: string | null;
    created_at: Date;
    updated_at: Date;
}

export const CoursePostInputSchema = z.object({
    name: z.string().min(1).max(255).refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
    department_id: z.number().positive(),
    course_code: z.number().min(1000).max(10000),
    description: z.string().max(1000).refine((s) => s === s.trim(), "Description cannot have leading/trailing spaces"),
    num_credits: z.number().min(1).max(6),
    lecture_type: z.enum(["lecture", "lab", "online"]).optional(),
    prereqs: z.string().max(1000).optional(),
    coreqs: z.string().max(1000).optional(),
    nupath: z.string().max(255).optional(),
});

export type CoursePostInputType = z.infer<typeof CoursePostInputSchema>;

export const CoursePatchInputSchema = CoursePostInputSchema.partial();
export type CoursePatchInputType = z.infer<typeof CoursePatchInputSchema>



export const CourseFilterSchema = z.object({
    department_id: z.coerce.number().optional(),
    course_code: z.coerce.number().optional(),
    num_credits: z.coerce.number().optional(),
    lecture_type: z.enum(["lecture", "lab", "online"]).optional(),
    nupath: z.string().max(255).optional(),
    sortBy: z.enum(["name", "course_code", "num_credits", "created_at"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type CourseFilterType = z.infer<typeof CourseFilterSchema>;