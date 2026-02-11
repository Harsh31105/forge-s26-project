import { Pool, type PoolConfig } from "pg";
import { Repository } from "../storage";
import {type DB, getConnectionString} from "../../config/db";
import { setTimeout } from "node:timers/promises";



export async function connectDatabase(dbConfig: DB): Promise<Pool> {
    console.log(`Pool Config - MaxConns: ${dbConfig.maxOpenConns},
                                        MinConns: ${dbConfig.maxIdleConns},
                                        MaxLifetime: ${dbConfig.connMaxLifetime}`
    );

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

    console.log("Connected to database!");
    return pool;
}