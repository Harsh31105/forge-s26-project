import express, {Express, Router} from "express";
import { Repository } from "../storage/storage";
import {Pool} from "pg";
import {configurePool, getConnectionString} from "../config/db";
import { config } from "../config/config";
import { drizzle } from "drizzle-orm/node-postgres";
import {SampleHandler} from "./handler/sample";
import {sampleRoutes} from "./handler/sample/routes";
import morgan from "morgan";
import compression from "compression";
import cors from "cors";
import {errorHandler} from "../errs/httpError";
import YAML from "yamljs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { CourseThreadHandler } from "./handler/courseThreads";
import { courseThreadRoutes } from "./handler/courseThreads/routes";

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
            ],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
            credentials: true,
            exposedHeaders: ["Content-Length", "X-Request-ID"],
        }));

        this.server.get("/health", (_req, res) => res.sendStatus(200));
        this.server.get("/", (req, res) => {
            res.send("API is running!");
        });

        const apiV1 = Router();
        this.server.use("/api/v1", apiV1);

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
    })
    configurePool(pool, config.db);

    const db = drizzle(pool);
    const repo = new Repository(pool, db);

    return new App(repo);
}

function registerRoutes(router: Router, repo: Repository) {
    const sampleHandler = new SampleHandler(repo.samples);
    router.use("/samples", sampleRoutes(sampleHandler));
  
    const courseThreadHandler = new CourseThreadHandler(repo.courseThreads);
    router.use("/course-reviews", courseThreadRoutes(courseThreadHandler));
  }