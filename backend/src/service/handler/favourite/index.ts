import { AuthenticatedRequest } from "../../../types/express";
import {
    Favourite,
    FavouritePostInputSchema,
    FavouritePostInputType
} from "../../../models/favourite";
import {BadRequest, mapDBError} from "../../../errs/httpError";
import { Request, Response } from "express";

export class FavouriteHandler {
    constructor(private readonly repo: FavouriteRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        const studentID = (req as AuthenticatedRequest).user.id;

        let favourites: Favourite[]
        try {
            favourites = await this.repo.getFavourites(studentID);
        } catch (err) {
            console.log("Failed to get favourites: ", err);
            throw mapDBError(err, "failed to retrieve favourties");
        }

        res.status(200).json(favourites);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const studentID = (req as AuthenticatedRequest).user.id;

        const result = FavouritePostInputSchema.safeParse(req.body);
        if (!result.success) throw BadRequest("unable to parse input for post-favourite");
        const postFavourite: FavouritePostInputType = result.data;

        let newFavourite: Favourite;
        try {
            newFavourite = await this.repo.postFavourite(studentID, postFavourite);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post favourite");
        }

        res.status(201).json(newFavourite);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const studentID = (req as AuthenticatedRequest).user.id;
        const courseID = req.params.id;

        try {
            await this.repo.deleteFavourites(studentID, courseID);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete favourite");
        }

        res.sendStatus(204);
    }
}