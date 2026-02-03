"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const application_1 = require("./application");
const db_1 = require("./db");
const supabase_1 = require("./supabase");
exports.config = Object.freeze({
    application: application_1.applicationConfig,
    db: db_1.dbConfig,
    supabase: supabase_1.supabaseConfig,
});
function validateConfig() {
    const missing = [];
    if (!exports.config.db.host)
        missing.push("DB_HOST");
    if (!exports.config.db.port)
        missing.push("DB_PORT");
    if (!exports.config.db.user)
        missing.push("DB_USER");
    if (!exports.config.db.password)
        missing.push("DB_PASSWORD");
    if (!exports.config.db.name)
        missing.push("DB_NAME");
    if (!exports.config.supabase.url)
        missing.push("SUPABASE_URL");
    if (!exports.config.supabase.anonKey)
        missing.push("SUPABASE_ANON_KEY");
    if (!exports.config.supabase.serviceRoleKey)
        missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: \n${missing.join("\n")}`);
    }
}
//# sourceMappingURL=config.js.map