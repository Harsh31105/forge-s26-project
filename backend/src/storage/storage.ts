import { Pool } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
   Sample,
  SamplePatchInputType,
  SamplePostInputType,
 } from "../models/sample";
import type {
   CourseReview,
  ProfessorReview,
  Review,
  ReviewPatchInputType,
} from "../models/review";
import { SampleRepositorySchema } from "./postgres/schema/samples";
import { ReviewRepositorySchema } from "./postgres/schema/reviews";

import type {
  Course,
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
import { PaginationType } from "utils/pagination";
import type {
  Professor,
  ProfessorPatchInputType,
  ProfessorPostInputType,
} from "../models/professor";
import { ProfessorRepositorySchema } from "./postgres/schema/professor";
import type { TraceDocumentRepository } from "./s3/traceDocuments";
import { TraceDocumentRepositoryS3 } from "./s3/traceDocuments";
import type { S3 as S3Config } from "../config/s3";
import {Student, StudentPatchInputType, StudentPostInputType} from "../models/student";
import { StudentRepositorySchema } from "./postgres/schema/students";

import type {
  ProfThread,
  ProfessorThreadPostInputType,
  ProfessorThreadPatchInputType,
} from "../models/profThreads";
import { ProfThreadRepositorySchema } from "./postgres/schema/profThread";
import type { RMP, RMPPostInputType } from "../models/rmp";
import { RMPRepositorySchema } from "./postgres/schema/rmp";

export class Repository {
  public readonly samples: SampleRepository;
  public readonly professors: ProfessorRepository;
  public readonly courses: CourseRepository;
  public readonly courseThreads: CourseThreadRepository;
  public readonly profThreads: ProfThreadRepository;
  public readonly traceDocuments: TraceDocumentRepository;
  public readonly reviews: ReviewRepository;
  public readonly students: StudentRepository;
    public readonly rmp: RMPRepository;
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
    this.students = new StudentRepositorySchema(db);

        this.rmp = new RMPRepositorySchema(db);
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
  createParentReview(studentId?: string | null): Promise<string>;
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
    getCourses(pagination: PaginationType): Promise<Course[]>;
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
  getProfessors(pagination: PaginationType): Promise<Professor[]>;
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
    getStudentByID(id: string): Promise<Student>;
    createStudent(input: StudentPostInputType): Promise<Student>;
    patchStudent(id: string, input: StudentPatchInputType): Promise<Student>;
    deleteStudent(id: string): Promise<void>;
}


export interface RMPRepository {
    getRMPByProfessorID(professorId: string): Promise<RMP>;
    postRMP(input: RMPPostInputType[]): Promise<RMP[]>;
}