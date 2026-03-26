import { z } from "zod";

export interface Favourite {
    student_id: string;
    course_id: string;
    created_at: Date;
    updated_at: Date;
}

export const FavouritePostInputSchema = z.object({
    course_id: z.uuid(),
});
export type FavouritePostInputType = z.infer<typeof FavouritePostInputSchema>;