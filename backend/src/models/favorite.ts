import { z } from "zod";

export interface Favorite {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export const FavoritePostInputSchema = z.object({
    name: z.string().min(1, "Name cannot be empty")
    .refine((s) => s === s.trim(), "Name cannot have leading/trailing spaces"),
})
export type FavoritePostInputType = z.infer<typeof FavoritePostInputSchema>;

export const FavoritesListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20), 
    offset: z.coerce.number().int().min(0).default(0),
});

export type FavoritesListQueryType = z.infer<typeof FavoritesListQuerySchema>;

export interface FavoritesListResponse {
    items: Favorite[];
    total: number;
    limit: number;
    offset: number;
}
