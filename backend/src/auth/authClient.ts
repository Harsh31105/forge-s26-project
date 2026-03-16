import { OAuth2Client } from "google-auth-library";
import { config } from "../config/config";

export const googleClient = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectURI
);

export function getAuthUrl(): string {
    return googleClient.generateAuthUrl({
        access_type: "offline",
        scope: ["email", "profile"],
    });
}