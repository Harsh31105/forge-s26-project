import process from "process";

export interface Application {
    port: string;
    environment: string;
    allowedOrigins: string;
}

export const applicationConfig: Application = {
    port: process.env.PORT || '8080',
    environment: process.env.ENVIRONMENT || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
}