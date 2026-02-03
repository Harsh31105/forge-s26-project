"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const pg_1 = require("pg");
const db_1 = require("../../config/db");
const promises_1 = require("node:timers/promises");
async function connectDatabase(dbConfig) {
    console.log(`Pool Config - MaxConns: ${dbConfig.maxOpenConns},
                                        MinConns: ${dbConfig.maxIdleConns},
                                        MaxLifetime: ${dbConfig.connMaxLifetime}`);
    const poolConfig = {
        connectionString: (0, db_1.getConnectionString)(dbConfig),
        max: dbConfig.maxOpenConns || 10,
        idleTimeoutMillis: (dbConfig.maxConnIdleTime || 5 * 60) * 1000,
    };
    const pool = new pg_1.Pool(poolConfig);
    const PING_TIMEOUT_MS = 100 * 1000;
    try {
        await Promise.race([
            pool.query("SELECT 1"),
            (0, promises_1.setTimeout)(PING_TIMEOUT_MS).then(() => {
                throw new Error("Database ping timed out");
            }),
        ]);
    }
    catch (err) {
        await pool.end();
        throw err;
    }
    console.log("Connected to database!");
    return pool;
}
//# sourceMappingURL=storage.js.map