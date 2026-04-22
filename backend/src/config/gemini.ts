import process from "process";

export interface Gemini {
    apiKey: string;
}

export const geminiConfig: Gemini = {
    apiKey: process.env.GEMINI_API_KEY || '',
};
