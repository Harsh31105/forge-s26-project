import { z } from "zod";

export interface Favorite {
    student_id: string;
    course_id: string;
    created_at: Date;
    updated_at: Date;
}

export const FavoritePostInputSchema = z.object({
    student_id: z.string().uuid("student_id must be a valid input"),
    course_id: z.string().uuid("course_id must be a valid UUID"),
})
export type FavoritePostInputType = z.infer<typeof FavoritePostInputSchema>;

