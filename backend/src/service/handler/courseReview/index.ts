import type { CourseReviewRepository } from "../../../storage/storage";
import {
  CourseReview,
  CourseReviewPatchInputSchema,
  CourseReviewPatchInputType,
  CourseReviewPostInputSchema,
  CourseReviewPostInputType,
} from "../../../models/courseReview";
import {
  BadRequest,
  mapDBError,
  NotFound,
  NotFoundError,
} from "../../../errs/httpError";
import { Request, Response } from "express";
import { validate as isUUID } from "uuid";

export class CourseReviewHandler {
  constructor(private readonly repo: CourseReviewRepository) {}

  async handleGet(_req: Request, res: Response): Promise<void> {
    let reviews: CourseReview[];

    try {
      reviews = await this.repo.getCourseReviews();
    } catch (err) {
      console.log("Failed to get course reviews: ", err);
      throw mapDBError(err, "failed to retrieve course reviews");
    }

    res.status(200).json(reviews);
  }

  async handleGetByID(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    if (!isUUID(id)) throw BadRequest("invalid ID was given");

    let review: CourseReview;
    try {
      review = await this.repo.getCourseReviewByID(id);
    } catch (err) {
      console.log(err);
      if (err instanceof NotFoundError) NotFound("course review not found");
      throw mapDBError(err, "failed to retrieve course review");
    }

    res.status(200).json(review);
  }

  async handlePost(req: Request, res: Response): Promise<void> {
    const result = CourseReviewPostInputSchema.safeParse(req.body);
    if (!result.success) {
      throw BadRequest("unable to parse input for post-course-review");
    }
    const postReview: CourseReviewPostInputType = result.data;

    let newReview: CourseReview;
    try {
      newReview = await this.repo.createCourseReview(postReview);
    } catch (err) {
      console.log(err);
      throw mapDBError(err, "failed to post course review");
    }

    res.status(201).json(newReview);
  }

  async handlePatch(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    if (!isUUID(id)) throw BadRequest("invalid ID was given");

    const result = CourseReviewPatchInputSchema.safeParse(req.body);
    if (!result.success) {
      throw BadRequest("unable to parse input for patch-course-review");
    }
    const patchReview: CourseReviewPatchInputType = result.data;

    let updated: CourseReview;
    try {
      updated = await this.repo.patchCourseReview(id, patchReview);
    } catch (err) {
      console.log(err);
      throw mapDBError(err, "failed to patch course review");
    }

    res.status(200).json(updated);
  }

  async handleDelete(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    if (!isUUID(id)) throw BadRequest("invalid ID was given");

    try {
      await this.repo.deleteCourseReview(id);
    } catch (err) {
      console.log(err);
      throw mapDBError(err, "failed to delete course review");
    }

    res.sendStatus(204);
  }
}
