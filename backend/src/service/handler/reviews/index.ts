import type { ReviewRepository } from "../../../storage/storage";
import {
  Review,
  ReviewPatchInputSchema,
  ReviewPatchInputType,
  ReviewPostInputSchema,
  ReviewPostInputType,
  PaginationQuerySchema,
} from "../../../models/review";
import {
  BadRequest,
  mapDBError,
  NotFound,
  NotFoundError,
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";
import leoProfanity from "leo-profanity";

export class ReviewHandler {
  constructor(private readonly repo: ReviewRepository) {}

  async handleGet(req: Request, res: Response): Promise<void> {
    const pagination = PaginationQuerySchema.safeParse(req.query);
    if (!pagination.success) throw BadRequest("invalid pagination parameters");

    let reviews: Review[];

    try {
      reviews = await this.repo.getReviews(pagination.data);
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
    const censoredText = leoProfanity.clean(postReview.reviewText);

    let newReview: Review;
    try {
      const parentId = await this.repo.createParentReview(postReview.studentId);
      if (postReview.courseId) {
        newReview = await this.repo.createCourseReview(parentId, {
          courseId: postReview.courseId,
          rating: postReview.rating,
          reviewText: censoredText,
          ...(postReview.tags && { tags: postReview.tags }),
        });
      } else {
        newReview = await this.repo.createProfessorReview(parentId, {
          profId: postReview.profId!,
          rating: postReview.rating,
          reviewText: censoredText,
          ...(postReview.tags && { tags: postReview.tags }),
        });
      }
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
    const patchReview: ReviewPatchInputType = {
      ...result.data,
      ...(result.data.reviewText && { reviewText: leoProfanity.clean(result.data.reviewText) }),
    };

    let updatedReview: Review;
    try {
      updatedReview = await this.repo.patchReview(id, patchReview);
    } catch (err) {
      console.log(err);
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
