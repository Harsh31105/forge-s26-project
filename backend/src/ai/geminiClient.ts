import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/config";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateReviewSummary(
    reviewText: string,
    threads: string[],
): Promise<string> {
    const threadContent = threads.length > 0
        ? `\n\nReplies:\n${threads.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
        : "\n\nNo replies yet.";

    const prompt = `Summarize the following course or professor review and its discussion in 2-3 sentences. Focus on the themes students are discussing.

Review: ${reviewText}${threadContent}

Summary:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}
