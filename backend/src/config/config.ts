import type { Application } from "./application";
import { applicationConfig } from "./application";
import type { DB } from "./db";
import { dbConfig } from "./db";
import type { Supabase } from "./supabase"
import { supabaseConfig } from "./supabase";

export interface configuration {
    application: Application;
    db: DB,
    supabase: Supabase
}

export const config = Object.freeze({
    application: applicationConfig,
    db: dbConfig,
    supabase: supabaseConfig,
});

export function validateConfig() {
    const missing: string[] = [];

    if (!config.db.host) missing.push("DB_HOST");
    if (!config.db.port) missing.push("DB_PORT");
    if (!config.db.user) missing.push("DB_USER");
    if (!config.db.password) missing.push("DB_PASSWORD");
    if (!config.db.name) missing.push("DB_NAME");

    if (!config.supabase.url) missing.push("SUPABASE_URL");
    if (!config.supabase.anonKey) missing.push("SUPABASE_ANON_KEY");
    if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: \n${missing.join("\n")}`);
    }
}

