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
import { student } from "storage/tables/student";
import { course } from "storage/tables/course";
import { create } from "node:domain";

export class FavoritesRepositorySchema implements FavoriteRepository {
    constructor(private readonly db: NodePgDatabase) {
    }

    async getFavorites(pagination: PaginationType): Promise<Favorite[]> {
        const rows = await this.db
        .select()
        .from(favorite)
        .limit(pagination.limit)
        .offset(getOffset(pagination))
        

        return rows.map((row) => ({
            student_id: row.studentId,
            course_id: row.courseId,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
        })); 
    }
    

    async createFavorite(input: FavoritePostInputType): Promise<Favorite> {
        const [row] = await this.db
        .insert(favorite)
        .values({ 
            studentId: input.student_id, 
            courseId: input.course_id, 
          })
        .returning();
    
        if (!row) {
            throw new Error("failed to create favorite");
        }
        return {
            student_id: row.studentId,
            course_id: row.courseId,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
        };
    }

    async deleteFavorite(student_id: string, course_id: string): Promise<void> {
        const [row] = await this.db
        .delete(favorite)
        .where(
            and(
                eq(favorite.studentId, student_id),
                eq(favorite.courseId, course_id)))
            .returning();
        if (!row) {
            throw new Error("failed to find favorite");
        }
        }

    }




