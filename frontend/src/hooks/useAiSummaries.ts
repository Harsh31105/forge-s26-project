import { useQuery } from "@tanstack/react-query";
import { getAiSummaries } from "@/src/lib/api/ai-summaries";
import type { GetAiSummariesPopularParams } from "@/src/lib/api/northStarAPI.schemas";

export function useAiSummaries(params?: GetAiSummariesPopularParams) {
    const api = getAiSummaries();

    const { data, isLoading, error } = useQuery({
        queryKey: ["aiSummaries", params],
        queryFn: () => api.getAiSummariesPopular(params),
    });

    return { summaries: data || [], isLoading, error: error?.message || null };
}
