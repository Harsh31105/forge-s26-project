"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initApp = initApp;
const express_1 = __importStar(require("express"));
const storage_1 = require("../storage/storage");
const pg_1 = require("pg");
const db_1 = require("../config/db");
const config_1 = require("../config/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const sample_1 = require("./handler/sample");
const routes_1 = require("./handler/sample/routes");
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const httpError_1 = require("../errs/httpError");
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
class App {
    server;
    repo;
    constructor(repo) {
        this.server = (0, express_1.default)();
        this.repo = repo;
        this.server.use(express_1.default.json());
        this.server.use(express_1.default.urlencoded({ extended: true }));
        this.server.use((0, morgan_1.default)("dev"));
        this.server.use((0, compression_1.default)());
        this.server.use((0, cors_1.default)({
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
        const apiV1 = (0, express_1.Router)();
        this.server.use("/api/v1", apiV1);
        const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, "../../api/openapi.yaml"));
        this.server.use("/swagger/index.html", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
        registerRoutes(apiV1, this.repo);
        this.server.use(httpError_1.errorHandler);
        this.server.use((_req, res) => res.status(404).json({ error: "Route not found" }));
    }
    listen(port) {
        this.server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}
function initApp() {
    const pool = new pg_1.Pool({
        connectionString: (0, db_1.getConnectionString)(config_1.config.db),
        ssl: { rejectUnauthorized: false },
    });
    (0, db_1.configurePool)(pool, config_1.config.db);
    const db = (0, node_postgres_1.drizzle)(pool);
    const repo = new storage_1.Repository(pool, db);
    return new App(repo);
}
function registerRoutes(router, repo) {
    const sampleHandler = new sample_1.SampleHandler(repo.samples);
    router.use("/samples", (0, routes_1.sampleRoutes)(sampleHandler));
}
//# sourceMappingURL=server.js.map