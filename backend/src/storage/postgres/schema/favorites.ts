import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
    Favorite, 
    FavoritePostInputType, 
    } from "../../../models/favorite";
import {FavoriteRepository} from "../../storage";
import {favorite} from "../../tables/favorite";
import { eq, and } from "drizzle-orm";
import {NotFoundError} from "../../../errs/httpError";
import { getOffset, PaginationType } from "../../../utils/pagination";

export class FavoritesRepositorySchema implements FavoriteRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getFavorites(pagination: PaginationType): Promise<Favorite[]> {
        return this.db
        .select()
        .from(favorite)
        .limit(pagination.limit)
        .offset(getOffset(pagination))
        }

    async createFavorite(input: FavoritePostInputType): Promise<Favorite> {
        const [row] = await this.db
        .insert(favorite)
        .values({ 
            student_id: input.student_id, 
            course_id: input.course_id })
        .returning();
    
        if (!row) {
            throw new Error("failed to create favorite");
        }
        return row as Favorite;
    }

    async deleteFavorite(student_id: string, course_id: string): Promise<void> {
        const [row] = await this.db
        .delete(favorite)
        .where(
            and(
                eq(favorite.student_id, student_id),
                eq(favorite.course_id, course_id)))
            .returning();
        if (!row) {
            throw new Error("failed to find favorite");
        }
        }

    }




