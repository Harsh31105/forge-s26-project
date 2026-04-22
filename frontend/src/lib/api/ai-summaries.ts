import type { AiSummary, GetAiSummariesPopularParams } from "./northStarAPI.schemas";
import { customAxios } from "./apiClient";

export const getAiSummaries = () => {
  const getAiSummariesPopular = (params?: GetAiSummariesPopularParams) =>
    customAxios<AiSummary[]>({ url: `/ai-summaries/popular`, method: "GET", params });
  return { getAiSummariesPopular };
};

export type GetAiSummariesPopularResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAiSummaries>["getAiSummariesPopular"]>>
>;
