export interface AiSummary {
    id: string;
    reviewId: string;
    reviewType: "course" | "professor";
    summary: string;
    score: number;
    summaryUpdatedAt: Date;
    createdAt: Date;
}

export interface AiSummaryUpsertInput {
    reviewId: string;
    reviewType: "course" | "professor";
    summary: string;
    score: number;
}

export interface ReviewWithScore {
    reviewId: string;
    reviewType: "course" | "professor";
    reviewText: string;
    score: number;
}
