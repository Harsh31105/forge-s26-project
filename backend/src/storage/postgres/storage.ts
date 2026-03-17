import { Pool, type PoolConfig } from "pg";
import { Repository } from "../storage";
import {type DB, getConnectionString} from "../../config/db";
import { setTimeout } from "node:timers/promises";
import logger from "../../utils/logger";



export async function connectDatabase(dbConfig: DB): Promise<Pool> {
    logger.debug({ maxConns: dbConfig.maxOpenConns, minConns: dbConfig.maxIdleConns, maxLifetime: dbConfig.connMaxLifetime }, "Pool config");

    const poolConfig: PoolConfig = {
        connectionString: getConnectionString(dbConfig),
        max: dbConfig.maxOpenConns || 10,
        idleTimeoutMillis: (dbConfig.maxConnIdleTime || 5 * 60) * 1000,
    };
    const pool = new Pool(poolConfig);

    const PING_TIMEOUT_MS = 100 * 1000;
    try {
        await Promise.race([
            pool.query("SELECT 1"),
            setTimeout(PING_TIMEOUT_MS).then(() => {
                throw new Error("Database ping timed out");
            }),
        ]);
    } catch (err) {
        await pool.end();
        throw err;
    }

    logger.info("Connected to database");
    return pool;
}