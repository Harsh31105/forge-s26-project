import process from "process";

export interface DB {
    host: string;
    port: string;
    user: string;
    password: string;
    name: string;
    maxOpenConns?: number;
    maxIdleConns?: number;
    maxConnIdleTime?: number;
    connMaxLifetime?: number;
}

export const dbConfig: DB = {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
    maxOpenConns: parseInt(process.env.DB_MAX_OPEN_CONNS || '50'),
    maxIdleConns: parseInt(process.env.DB_MAX_IDLE_CONNS || '5'),
    maxConnIdleTime: parseInt(process.env.DB_CONN_MAX_IDLE_TIME || '100000'),
    connMaxLifetime: parseInt(process.env.DB_CONN_MAX_LIFETIME || '0'),
}

export function getConnectionString(config: DB): string {
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.name}?sslmode=require`
}

export function configurePool(pool: any, config: DB) {
    pool.options.max = config.maxOpenConns ?? 25;
    pool.options.idleTimeoutMillis = (config.maxConnIdleTime ?? 300000);
    pool.options.connectionTimeoutMillis = (config.connMaxLifetime ?? 0) * 1000;
}