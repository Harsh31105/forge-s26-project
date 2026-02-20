import { z } from "zod";

export interface Favorites {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export const FavoritesPostInputSchema = z.object({
    name: z.string().min(1, "Name cannot be empty")
           .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
})
export type FavoritesPostInputType = z.infer<typeof FavoritesPostInputSchema>;

export const FavoritesPatchInputSchema = FavoritesPostInputSchema.partial();
export type FavoritesPatchInputType = z.infer<typeof FavoritesPatchInputSchema>
