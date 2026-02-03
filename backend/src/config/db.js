"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = void 0;
exports.getConnectionString = getConnectionString;
exports.configurePool = configurePool;
const process_1 = __importDefault(require("process"));
exports.dbConfig = {
    host: process_1.default.env.DB_HOST,
    port: process_1.default.env.DB_PORT,
    user: process_1.default.env.DB_USER,
    password: process_1.default.env.DB_PASSWORD,
    name: process_1.default.env.DB_NAME,
    maxOpenConns: parseInt(process_1.default.env.DB_MAX_OPEN_CONNS || '50'),
    maxIdleConns: parseInt(process_1.default.env.DB_MAX_IDLE_CONNS || '5'),
    maxConnIdleTime: parseInt(process_1.default.env.DB_CONN_MAX_IDLE_TIME || '100000'),
    connMaxLifetime: parseInt(process_1.default.env.DB_CONN_MAX_LIFETIME || '0'),
};
function getConnectionString(config) {
    console.log(`postgresql://${config.user}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.name}`);
    return `postgresql://${config.user}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.name}`;
}
function configurePool(pool, config) {
    pool.options.max = config.maxOpenConns ?? 25;
    pool.options.idleTimeoutMillis = (config.maxConnIdleTime ?? 300000);
    pool.options.connectionTimeoutMillis = (config.connMaxLifetime ?? 0) * 1000;
}
//# sourceMappingURL=db.js.map