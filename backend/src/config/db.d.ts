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
export declare const dbConfig: DB;
export declare function getConnectionString(config: DB): string;
export declare function configurePool(pool: any, config: DB): void;
//# sourceMappingURL=db.d.ts.map