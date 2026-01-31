import process from "process";

export interface Supabase {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
}

export const supabaseConfig: Supabase = {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}