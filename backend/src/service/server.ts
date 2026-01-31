import express, { Express } from "express";
import { Repository } from "../storage/storage";
import {Pool} from "pg";
import {configurePool, getConnectionString} from "../config/db";
import { config } from "../config/config";
import { drizzle } from "drizzle-orm/node-postgres";
import {SampleHandler} from "./handler/sample";
import {sampleRoutes} from "./handler/sample/routes";
import morgan from "morgan";
import compression from "compression";
import favicon from "serve-favicon";
import path from "path";
import cors from "cors";
import {errorHandler} from "../errs/httpError";

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
        this.server.use(favicon(path.join(process.cwd(), "public", "favicon.io")));
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
        this.server.use(errorHandler);

        this.server.get("/health", (_req, res) => res.sendStatus(200));

        registerRoutes(this.server, this.repo);

        this.server.use((_req, res) => res.status(404).json({ error: "Route not found" }));
    }

    listen(port: string) {
        this.server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}

function initApp(): App {
    const pool = new Pool({
        connectionString: getConnectionString(config.db),
    })
    configurePool(pool, config.db);

    const db = drizzle(pool);
    const repo = new Repository(pool, db);

    return new App(repo);
}

function registerRoutes(app: Express, repo: Repository) {
    const sampleHandler = new SampleHandler(repo.samples);
    app.use("/api/v1/samples", sampleRoutes(sampleHandler));
}