import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
    Favorite, 
    FavoritePostInputType, 
    FavoritesListQueryType, 
    FavoritesListResponse} from "../../../models/favorite";
import {FavoriteRepository} from "../../storage";
import {favorite} from "../../tables/favorite";
import { eq, sql } from "drizzle-orm";
import {NotFoundError} from "../../../errs/httpError";

export class FavoritesRepositorySchema implements FavoriteRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getFavorites(query: FavoritesListQueryType): Promise<FavoritesListResponse> {
        const { limit, offset } = query;

        const items = await this.db
        .select()
        .from(favorite)
        .limit(limit)
        .offset(offset)
        .orderBy(favorite.createdAt);
        
        const countRows = await this.db
        .select({ count : sql<number>`count(*)` })
        .from(favorite);

        const total = Number(countRows[0]?.count ?? 0);

        return {
            items: items as Favorite[], 
            total, 
            limit, 
            offset, };
        }

        async createFavorite(input: FavoritePostInputType): Promise<Favorite> {
            const [row] = await this.db
            .insert(favorite)
            .values({ name: input.name })
            .returning();
    
            if (!row) {
                throw new Error("failed to create favorite");
            }
            return row as Favorite;
        }

        async deleteFavorite(id: string): Promise<void> {
            const deleted = await this.db
            .delete(favorite)
            .where(eq(favorite.id, id))
            .returning({id: favorite.id});
    
            if (deleted.length === 0){
                throw new NotFoundError("favorite with given ID");
            }
        }
    }



