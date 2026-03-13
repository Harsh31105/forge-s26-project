import type { FavoriteRepository } from "../../../storage/storage";

import{
    Favorite,
    FavoritePostInputSchema,
    FavoritePostInputType, 
} from "../../../models/favorite";
import {
    BadRequest,
    mapDBError,
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

import { getOffset, PaginationSchema } from "../../../utils/pagination";


import { z } from "zod";
import { student } from "storage/tables/student";


export class FavoriteHandler {
    constructor(private readonly repo: FavoriteRepository) {}

    async handleGet(req: Request, res: Response) :Promise<void> {
            const result = PaginationSchema.safeParse(req.query);
            if (!result.success) {
                throw BadRequest("Invalid pagination parameters");
            }
            const pagination = result.data;
    
            let favorites: Favorite[];
    
            try {
                favorites = await this.repo.getFavorites(pagination);
            } catch (err) {
                console.log("Failed to get favorites: ", err);
                throw mapDBError(err, "failed to retrieve favorites");
            }
    
            res.status(200).json(favorites);
        }


    async handlePost(req: Request, res: Response): Promise<void> {
            const result = FavoritePostInputSchema.safeParse(req.body);
            if (!result.success) {
                throw BadRequest("unable to parse input for post-favorite")
            }
            const postSample: FavoritePostInputType = result.data;
    
            let newFavorite: Favorite;
            try {
                newFavorite = await this.repo.createFavorite(postSample);
            } catch (err) {
                console.log(err);
                throw mapDBError(err, "failed to post sample");
            }
    
            res.status(201).json(newFavorite);
        }


    async handleDelete(req: Request, res: Response): Promise<void> {
        const student_id = req.params.student_id as string;
        const course_id = req.params.course_id as string;

        if (!isUUID(student_id)) {
            throw BadRequest("invalid student ID was given")};
        
        if (!isUUID(course_id)) {
            throw BadRequest("invalid course ID was given")};
        

        try {
            await this.repo.deleteFavorite(student_id, course_id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete favorite");
        }

        res.sendStatus(204);
    }
}
