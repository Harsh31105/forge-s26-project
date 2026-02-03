import type { Application } from "./application";
import type { DB } from "./db";
import type { Supabase } from "./supabase";
export interface configuration {
    application: Application;
    db: DB;
    supabase: Supabase;
}
export declare const config: Readonly<{
    application: Application;
    db: DB;
    supabase: Supabase;
}>;
export declare function validateConfig(): void;
//# sourceMappingURL=config.d.ts.map