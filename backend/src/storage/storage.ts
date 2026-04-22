import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  Sample,
  SamplePatchInputType,
  SamplePostInputType,
} from "../models/sample";
import type {
  CourseReview,
  CreateParentReviewInput,
  ProfessorReview,
  Review,
  ReviewPatchInputType,
} from "../models/review";
import { SampleRepositorySchema } from "./postgres/schema/samples";
import { ReviewRepositorySchema } from "./postgres/schema/reviews";

import type {
  Course,
  CourseFilterType,
  CoursePatchInputType,
  CoursePostInputType,
 } from "../models/course";
import { CourseRepositorySchema } from "./postgres/schema/course";
import type {
  CourseThread,
  CourseThreadPatchInputType,
  CourseThreadPostInputType,
} from "../models/courseThread";
import { CourseThreadRepositorySchema } from "./postgres/schema/courseThreads";
import { PaginationType } from "../utils/pagination";
import type {
  Professor,
  ProfessorFilterType,
  ProfessorPatchInputType,
  ProfessorPostInputType,
} from "../models/professor";
import { ProfessorRepositorySchema } from "./postgres/schema/professor";
import type { TraceDocumentRepository } from "./s3/traceDocuments";
import { TraceDocumentRepositoryS3 } from "./s3/traceDocuments";
import type { ProfilePictureRepository } from "./s3/profilePictures";
import { ProfilePictureRepositoryS3 } from "./s3/profilePictures";
import type { S3 as S3Config } from "../config/s3";
import {
  Student,
  Major,
  Minor,
  Concentration,
  StudentPatchInputType,
  StudentPostInputType
} from "../models/student";
import { StudentRepositorySchema } from "./postgres/schema/students";
import { AcademicRepositorySchema } from "./postgres/schema/academic";

import type {
  ProfThread,
  ProfessorThreadPostInputType,
  ProfessorThreadPatchInputType,
} from "../models/profThreads";
import { ProfThreadRepositorySchema } from "./postgres/schema/profThread";
import type { RMP, RMPPostInputType } from "../models/rmp";
import { RMPRepositorySchema } from "./postgres/schema/rmp";
import {Favourite, FavouritePostInputType} from "../models/favourite";
import {FavouriteRepositorySchema} from "./postgres/schema/favourites";
import {AcademicSemester, OfferHistoryFilterType, Trace, TraceFilterType} from "../models/trace";
import {TraceRepositorySchema} from "./postgres/schema/traces";
import type { AiSummary, AiSummaryUpsertInput, ReviewWithScore } from "../models/aiSummary";
import { AiSummaryRepositorySchema } from "./postgres/schema/aiSummaries";


export class Repository {
  public readonly samples: SampleRepository;
  public readonly professors: ProfessorRepository;
  public readonly courses: CourseRepository;
  public readonly courseThreads: CourseThreadRepository;
  public readonly profThreads: ProfThreadRepository;
  public readonly traceDocuments: TraceDocumentRepository;
  public readonly profilePictures: ProfilePictureRepository;
  public readonly rmp: RMPRepository;
  public readonly reviews: ReviewRepository;
  public readonly students: StudentRepository;
  public readonly favourites: FavouriteRepository;
  public readonly traces: TraceRepository;
  public readonly aiSummaries: AiSummaryRepository;
  public readonly academic: AcademicRepository;
  private readonly pool: Pool;
  private readonly db: NodePgDatabase;

  constructor(pool: Pool, db: NodePgDatabase, s3Config: S3Config) {
    this.pool = pool;
    this.db = db;
    this.samples = new SampleRepositorySchema(db);
    this.courses = new CourseRepositorySchema(db);
    this.courseThreads = new CourseThreadRepositorySchema(db);
    this.professors = new ProfessorRepositorySchema(db);
    this.profThreads = new ProfThreadRepositorySchema(db);
    this.reviews = new ReviewRepositorySchema(db);
    this.traceDocuments = new TraceDocumentRepositoryS3(s3Config);
    this.profilePictures = new ProfilePictureRepositoryS3(s3Config);
    this.students = new StudentRepositorySchema(db);
    this.favourites = new FavouriteRepositorySchema(db);
    this.rmp = new RMPRepositorySchema(db);
    this.traces = new TraceRepositorySchema(db);
    this.aiSummaries = new AiSummaryRepositorySchema(db);
    this.academic = new AcademicRepositorySchema(db);
  }

  async getDB(): Promise<NodePgDatabase> {
    return this.db;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export interface SampleRepository {
  getSamples(pagination: PaginationType): Promise<Sample[]>;
  getSampleByID(id: string): Promise<Sample>;
  createSample(input: SamplePostInputType): Promise<Sample>;
  patchSample(id: string, input: SamplePatchInputType): Promise<Sample>;
  deleteSample(id: string): Promise<void>;
}

export interface CourseReviewChildInput {
  courseId: string;
  rating: number;
  reviewText: string;
  tags?: string[];
}

export interface ProfessorReviewChildInput {
  professorId: string;
  rating: number;
  reviewText: string;
  tags?: string[];
}

export interface ReviewRepository {
  getReviews(pagination: PaginationType): Promise<Review[]>;
  getReviewByID(id: string): Promise<Review>;
  createParentReview(
    input: CreateParentReviewInput
  ): Promise<string>;
  createCourseReview(
    parentId: string,
    input: CourseReviewChildInput,
  ): Promise<CourseReview>;
  createProfessorReview(
    parentId: string,
    input: ProfessorReviewChildInput,
  ): Promise<ProfessorReview>;
  patchReview(id: string, input: ReviewPatchInputType): Promise<Review>;
  deleteReview(id: string): Promise<void>;
}

export interface CourseRepository {
    getCourses(pagination: PaginationType, filters: CourseFilterType): Promise<Course[]>;
    getCourseByID(id: string): Promise<Course>;
    createCourse(input: CoursePostInputType): Promise<Course>;
    patchCourse(id: string, input: CoursePatchInputType): Promise<Course>;
    deleteCourse(id: string): Promise<void>;
}

export interface CourseThreadRepository {
  getThreadsByCourseReviewId(
    courseReviewId: string,
    pagination: PaginationType,
  ): Promise<CourseThread[]>;
  createThread(
    courseReviewId: string,
    input: CourseThreadPostInputType,
  ): Promise<CourseThread>;
  patchThread(
    threadId: string,
    input: CourseThreadPatchInputType,
  ): Promise<CourseThread>;
  deleteThread(threadId: string): Promise<void>;
}
export interface ProfThreadRepository {
  getThreadsByProfessorReviewId(
    professorReviewId: string,
    pagination: PaginationType,
  ): Promise<ProfThread[]>;
  createThread(
    professorReviewId: string,
    input: ProfessorThreadPostInputType,
  ): Promise<ProfThread>;
  patchThread(
    threadId: string,
    input: ProfessorThreadPatchInputType,
  ): Promise<ProfThread>;
  deleteThread(threadId: string): Promise<void>;
}

export interface ProfessorRepository {
  getProfessors(pagination: PaginationType, filters: ProfessorFilterType): Promise<Professor[]>;
  getProfessorByID(id: string): Promise<Professor>;
  createProfessor(input: ProfessorPostInputType): Promise<Professor>;
  patchProfessor(
    id: string,
    input: ProfessorPatchInputType,
  ): Promise<Professor>;
  deleteProfessor(id: string): Promise<void>;
}

export interface StudentRepository {
    getStudents(pagination: PaginationType): Promise<Student[]>;
    getStudentByEmail(email: string): Promise<Student>;
    getStudentByID(id: string): Promise<Student>;
    createStudent(input: StudentPostInputType): Promise<Student>;
    patchStudent(id: string, input: StudentPatchInputType): Promise<Student>;
    deleteStudent(id: string): Promise<void>;
}

export interface FavouriteRepository {
  getFavourites(studentID: string): Promise<Favourite[]>;
  postFavourite(studentID: string, input: FavouritePostInputType): Promise<Favourite>;
  deleteFavourite(studentID: string, courseID: string): Promise<void>;

  getStudentIDsWhoFavourited(courseID: string): Promise<Favourite[]>;
}

export interface RMPRepository {
    getRMPByProfessorID(professorId: string): Promise<RMP>;
    postRMP(input: RMPPostInputType[]): Promise<RMP[]>;
}

export interface TraceRepository {
  getTraces(pagination: PaginationType, filters: TraceFilterType): Promise<Trace[]>;
  getBestProfessorsByCourseID(courseId: string): Promise<Professor[]>; // returns top 3 professors based on reviews for a given course
  getOfferHistory(pagination: PaginationType, filters: OfferHistoryFilterType): Promise<AcademicSemester[]>;
  getAllTraces(): Promise<Trace[]>;
}

export interface AiSummaryRepository {
  getByReviewId(reviewId: string, reviewType: "course" | "professor"): Promise<AiSummary | null>;
  upsertSummary(data: AiSummaryUpsertInput): Promise<AiSummary>;
  getTopScoredReviews(reviewType: "course" | "professor", limit: number): Promise<ReviewWithScore[]>;
  markStaleIfThresholdMet(reviewId: string, reviewType: "course" | "professor", threshold: number): Promise<void>;
}

export type { ProfilePictureRepository } from "./s3/profilePictures";

export interface AcademicRepository {
  getMajors(): Promise<Major[]>;
  getConcentrations(): Promise<Concentration[]>;
  getMinors(): Promise<Minor[]>;
  getStudentMajors(studentId: string): Promise<Major[]>;
  getStudentConcentrations(studentId: string): Promise<Concentration[]>;
  getStudentMinors(studentId: string): Promise<Minor[]>;
  getMajorsForStudents(studentIds: string[]): Promise<Record<string, Major[]>>;
  getConcentrationsForStudents(studentIds: string[]): Promise<Record<string, Concentration[]>>;
  getMinorsForStudents(studentIds: string[]): Promise<Record<string, Minor[]>>;
  addStudentMajor(studentId: string, majorId: number): Promise<void>;
  deleteStudentMajor(studentId: string, majorId: number): Promise<void>;
  addStudentConcentration(studentId: string, concentrationId: number): Promise<void>;
  deleteStudentConcentration(studentId: string, concentrationId: number): Promise<void>;
  addStudentMinor(studentId: string, minorId: number): Promise<void>;
  deleteStudentMinor(studentId: string, minorId: number): Promise<void>;
}