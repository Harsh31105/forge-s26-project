import express, { Express, Router } from "express";
import { Repository } from "../storage/storage";
import { Pool } from "pg";
import { configurePool, getConnectionString } from "../config/db";
import { config } from "../config/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { SampleHandler } from "./handler/sample";
import { sampleRoutes } from "./handler/sample/routes";
import { ReviewHandler } from "./handler/reviews";
import { reviewRoutes } from "./handler/reviews/routes";
import { ProfessorHandler } from "./handler/professor";
import { professorRoutes } from "./handler/professor/routes";
import morgan from "morgan";
import compression from "compression";
import cors from "cors";
import { errorHandler } from "../errs/httpError";
import YAML from "yamljs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { CourseHandler } from "./handler/course";
import { courseRoutes } from "./handler/course/routes";
import { CourseThreadHandler } from "./handler/courseThreads";
import { courseThreadRoutes } from "./handler/courseThreads/routes";
import { AuthHandler } from "./handler/auth";
import { authRoutes } from "./handler/auth/routes";
import { authMiddleware, readOnlyMiddleware } from "../auth/middleware";
import cookieParser from "cookie-parser";
import { StudentHandler } from "./handler/student";
import { studentRoutes } from "./handler/student/routes";
import { AcademicHandler } from "./handler/academic";
import { academicRoutes } from "./handler/academic/routes";
import {FavouriteHandler} from "./handler/favourite";
import {favouriteRoutes} from "./handler/favourite/routes";
import { RMPHandler } from "./handler/rmp";
import { rmpRoutes } from "./handler/rmp/routes";
import { ProfThreadHandler } from "./handler/professorThreads";
import { professorThreadRoutes } from "./handler/professorThreads/routes";
import { TraceHandler } from "./handler/trace";
import { traceRoutes } from "./handler/trace/routes";
import { RecommendationHandler } from "./handler/recommendation";
import { recommendationRoutes } from "./handler/recommendation/routes";

class App {
    public server: Express;
    public repo: Repository;

    constructor(repo: Repository) {
        this.server = express();
        this.repo = repo;

        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: true }));
        this.server.use(morgan("dev"));
        this.server.use(compression());
        this.server.use(cors({
            origin: [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
            ],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization", "X-Api-Key"],
            credentials: true,
            exposedHeaders: ["Content-Length", "X-Request-ID"],
        }));
        this.server.use(cookieParser());

        const apiV1 = Router();
        this.server.use("/api/v1", apiV1);

        this.server.get("/health", (_req, res) => res.sendStatus(200));
        this.server.get("/", (_req, res) => {
            res.send("API is running!");
        });

        const swaggerDocument = YAML.load(path.join(__dirname, "../../api/openapi.yaml"));
        this.server.use("/swagger/index.html", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        registerRoutes(apiV1, this.repo);

        this.server.use(errorHandler);
        this.server.use((_req, res) => res.status(404).json({ error: "Route not found" }));
    }

    listen(port: string) {
        this.server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}

export function initApp(): App {
    const pool = new Pool({
        connectionString: getConnectionString(config.db),
        ssl: { rejectUnauthorized: false },
    });
    configurePool(pool, config.db);

    const db = drizzle(pool);
    const repo = new Repository(pool, db, config.s3);

    return new App(repo);
}

function registerRoutes(router: Router, repo: Repository) {
    const authHandler = new AuthHandler(repo.students);
    router.use("/auth", authRoutes(authHandler));

    // Public endpoints — no auth required
    const reviewHandler = new ReviewHandler(repo.reviews);
    router.use("/reviews", reviewRoutes(reviewHandler));

    const courseHandler = new CourseHandler(repo.courses, repo.favourites, repo.traces);
    router.use("/courses", courseRoutes(courseHandler));

    const professorHandler = new ProfessorHandler(repo.professors, repo.rmp);
    router.use("/professors", professorRoutes(professorHandler));

    router.use(authMiddleware);

    const sampleHandler = new SampleHandler(repo.samples);
    router.use("/samples", sampleRoutes(sampleHandler));

    // Handling Course-Threads - Starting with CourseReviews.
    const courseThreadHandler = new CourseThreadHandler(repo.courseThreads);
    router.use("/course-reviews", courseThreadRoutes(courseThreadHandler));

    const rmpHandler = new RMPHandler(repo.rmp, repo.professors);
    router.use("/rmp", rmpRoutes(rmpHandler));

    const profThreadHandler = new ProfThreadHandler(repo.profThreads);
    router.use("/professor-reviews", professorThreadRoutes(profThreadHandler));

    const studentHandler = new StudentHandler(repo.students, repo.academic, repo.profilePictures);
    router.use("/students", studentRoutes(studentHandler));

    const academicHandler = new AcademicHandler(repo.academic);
    router.use("/academic", academicRoutes(academicHandler));

    const favouritesHandler = new FavouriteHandler(repo.favourites);
    router.use("/favourites", favouriteRoutes(favouritesHandler));

    const traceHandler = new TraceHandler(repo.traces);
    router.use("/trace", traceRoutes(traceHandler));

    const recHandler = new RecommendationHandler(repo);
    router.use("/recommendations", recommendationRoutes(recHandler));
}