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

export const config = {
    application: applicationConfig,
    db: dbConfig,
    supabase: supabaseConfig,
}
