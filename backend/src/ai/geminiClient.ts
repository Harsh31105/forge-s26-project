import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/config";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export interface ReviewInput {
    reviewText: string;
    threads: string[];
}

export async function generateBatchSummaries(reviews: ReviewInput[]): Promise<string[]> {
    const reviewBlocks = reviews.map((r, i) => {
        const threadContent = r.threads.length > 0
            ? `Replies:\n${r.threads.map((t, j) => `${j + 1}. ${t}`).join("\n")}`
            : "No replies yet.";
        return `Review ${i + 1}:\n${r.reviewText}\n${threadContent}`;
    }).join("\n\n---\n\n");

    const prompt = `Summarize each of the following course/professor reviews in 2-3 sentences. Focus on the themes students are discussing.
    Return a JSON array of strings with exactly ${reviews.length} summaries in the same order as the reviews. Return only valid JSON, no markdown.
    ${reviewBlocks}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const summaries = JSON.parse(text);

    return summaries;
}
