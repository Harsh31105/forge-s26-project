import type { Application } from "./application";
import { applicationConfig } from "./application";
import type { DB } from "./db";
import { dbConfig } from "./db";
import type { S3 } from "./s3";
import { s3Config } from "./s3";
import type { Supabase } from "./supabase"
import { supabaseConfig } from "./supabase";

export interface configuration {
    application: Application;
    db: DB,
    s3: S3,
    supabase: Supabase
}

export const config = Object.freeze({
    application: applicationConfig,
    db: dbConfig,
    s3: s3Config,
    supabase: supabaseConfig,
});

export function validateConfig() {
    const missing: string[] = [];

    if (!config.db.host) missing.push("DB_HOST");
    if (!config.db.port) missing.push("DB_PORT");
    if (!config.db.user) missing.push("DB_USER");
    if (!config.db.password) missing.push("DB_PASSWORD");
    if (!config.db.name) missing.push("DB_NAME");

    if (!config.s3.accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
    if (!config.s3.secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");
    if (!config.s3.region) missing.push("AWS_REGION");
    if (!config.s3.bucketName) missing.push("S3_BUCKET_NAME");

    if (!config.supabase.url) missing.push("SUPABASE_URL");
    if (!config.supabase.anonKey) missing.push("SUPABASE_ANON_KEY");
    if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: \n${missing.join("\n")}`);
    }
}

