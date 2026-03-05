import type { FavoriteRepository } from "../../../storage/storage";

import {
    Favorite, 
    FavoritePostInputSchema, 
    FavoritePostInputType, 
    FavoritesListQueryType,
    FavoritesListQuerySchema
} from "../../../models/favorite";
import {
    BadRequest,
    mapDBError,
    NotFound,
    NotFoundError
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

import { z } from "zod";


export class FavoriteHandler {
    constructor(private readonly repo: FavoriteRepository) {}

    async handleGet(req: Request, res: Response) :Promise<void> {
        const query = FavoritesListQuerySchema.safeParse(req.query);
        if (!query.success) throw BadRequest("invalid query params for favorites");

        try {
            const result = await this.repo.getFavorites(query.data);
            res.status(200).json(result);
            } catch (err) {
            console.log("Failed to get favorites: ", err);
            throw mapDBError(err, "failed to retrieve favorites");
        }


    }


    async handlePost(req: Request, res: Response): Promise<void> {
        const parsed = FavoritePostInputSchema.safeParse(req.body);
        if (!parsed.success) {
            throw BadRequest("unable to parse input for post-favorite")
        }
       
        try {
            const created = await this.repo.createFavorite(parsed.data);
            res.status(201).json(created);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post favorite");
        }
    }


    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteFavorite(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete sample");
        }

        res.sendStatus(204);
    }
}
