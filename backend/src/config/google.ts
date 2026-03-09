import process from "process";

export interface Google {
    clientId: string;
    clientSecret: string;
    redirectURI: string;
    jwtSecret: string;
}

export const googleConfig: Google = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectURI: process.env.GOOGLE_REDIRECT_URI!,
    jwtSecret: process.env.JWT_SECRET!
}; 