import {FavouriteRepository} from "../../storage";
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {Favourite, FavouritePostInputType} from "../../../models/favourite";
import { favorite } from "../../tables/favourite";
import {and, eq} from "drizzle-orm";

export class FavouriteRepositorySchema implements FavouriteRepository {
    constructor(private readonly db: NodePgDatabase) {
        this.db = db;
    }

    async getStudentIDsWhoFavourited(courseID: string): Promise<Favourite[]> {
        return this.db.select().from(favorite).where(eq(favorite.courseId, courseID));
    }

    async getFavourites(studentID: string): Promise<Favourite[]> {
        return this.db.select().from(favorite).where(eq(favorite.studentId, studentID));
    }

    async postFavourite(studentID: string, input: FavouritePostInputType): Promise<Favourite> {
        const [row] = await this.db.insert(favorite).values({
            studentId: studentID,
            courseId: input.course_id
        }).returning();
        if (!row) throw Error();

        return row;
    }

    async deleteFavourite(studentID: string, courseID: string): Promise<void> {
        await this.db.delete(favorite).where(and(eq(favorite.courseId, courseID), eq(favorite.studentId, studentID)));
    }
}