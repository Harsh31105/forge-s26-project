import type { ReviewRepository } from "../../../storage/storage";
import {
    Review,
    ReviewPatchInputSchema,
    ReviewPatchInputType,
    ReviewPostInputSchema,
    ReviewPostInputType,
} from "../../../models/review";
import { BadRequest, mapDBError, NotFound, NotFoundError } from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class ReviewHandler {
    constructor(private readonly repo: ReviewRepository) {}

    async handleGet(req: Request, res: Response): Promise<void> {
        let reviews: Review[];

        try {
            reviews = await this.repo.getReviews();
        } catch (err) {
            console.log("Failed to get reviews: ", err);
            throw mapDBError(err, "failed to retrieve reviews");
        }

        res.status(200).json(reviews);
    }

    async handleGetByID(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        let review: Review;
        try {
            review = await this.repo.getReviewByID(id);
        } catch (err) {
            if (err instanceof NotFoundError) throw NotFound("review not found");
            throw mapDBError(err, "failed to retrieve review");
        }

        res.status(200).json(review);
    }

    async handlePost(req: Request, res: Response): Promise<void> {
        const result = ReviewPostInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for post-review");
        }
        const postReview: ReviewPostInputType = result.data;

        let newReview: Review;
        try {
            newReview = await this.repo.createReview(postReview);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to post review");
        }

        res.status(201).json(newReview);
    }

    async handlePatch(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        const result = ReviewPatchInputSchema.safeParse(req.body);
        if (!result.success) {
            throw BadRequest("unable to parse input for patch-review");
        }
        const patchReview: ReviewPatchInputType = result.data;

        let updatedReview: Review;
        try {
            updatedReview = await this.repo.patchReview(id, patchReview);
        } catch (err) {
            if (err instanceof NotFoundError) throw NotFound("review not found");
            throw mapDBError(err, "failed to patch review");
        }

        res.status(200).json(updatedReview);
    }

    async handleDelete(req: Request, res: Response): Promise<void> {
        const id = req.params.id as string;
        if (!isUUID(id)) throw BadRequest("invalid ID was given");

        try {
            await this.repo.deleteReview(id);
        } catch (err) {
            console.log(err);
            throw mapDBError(err, "failed to delete review");
        }

        res.sendStatus(204);
    }
}
