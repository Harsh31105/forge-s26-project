import { z } from "zod";

export const RecommendationRequestSchema = z.object({
    semester: z.enum(["fall", "spring", "summer_1", "summer_2"]),
});
export type RecommendationRequestType = z.infer<typeof RecommendationRequestSchema>;