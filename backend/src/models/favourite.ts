import { z } from "zod";

export interface Favourite {
    studentId: string;
    courseId: string;
    createdAt: Date;
    updatedAt: Date;
}

export const FavouritePostInputSchema = z.object({
    course_id: z.uuid(),
});
export type FavouritePostInputType = z.infer<typeof FavouritePostInputSchema>;