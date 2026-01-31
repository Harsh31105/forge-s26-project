import express, { Express } from "express";
import { Repository } from "../storage/storage";
import {Pool} from "pg";
import {configurePool, getConnectionString} from "../config/db";
import { config } from "../config/config";
import { drizzle } from "drizzle-orm/node-postgres";
import {SampleHandler} from "./handler/sample";
import {sampleRoutes} from "./handler/sample/routes";

class App {
    public server: Express;
    public repo: Repository;

    constructor(repo: Repository) {
        this.server = express();
        this.repo = repo;

        this.server.use(express.json());

        registerRoutes(this.server, this.repo);

        this.server.get("/health", (_req, res) => res.sendStatus(200));

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