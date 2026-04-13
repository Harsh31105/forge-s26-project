import process from "process";

export interface Application {
    port: string;
    environment: string;
    allowedOrigins: string;
    frontendUrl: string;
    animationApiKey: string;
}

export const applicationConfig: Application = {
    port: process.env.PORT || '8080',
    environment: process.env.ENVIRONMENT || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    animationApiKey: process.env.ANIMATION_API_KEY || '',
}