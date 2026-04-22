import { useMutation } from "@tanstack/react-query";
import { customAxios } from "../lib/api/apiClient";
import { MLRecommendResponse, RecommendResponse } from "../lib/api/northStarAPI.schemas";

type Semester = "fall" | "spring" | "summer_1" | "summer_2";

export function useRecommendations() {
    const recommendMutation = useMutation({
        mutationFn: (semester: Semester) =>
            customAxios<RecommendResponse>({
                url: "/recommendations",
                method: "POST",
                data: { semester },
            }),
    });

    const recommendMLMutation = useMutation({
        mutationFn: (semester: Semester) =>
            customAxios<MLRecommendResponse>({
                url: "/recommendations/ml",
                method: "POST",
                data: { semester },
            }),
    });

    return {
        getRecommendations: recommendMutation.mutateAsync,
        isLoadingRecommendations: recommendMutation.isPending,
        recommendationsError: recommendMutation.error?.message || null,

        getMLRecommendations: recommendMLMutation.mutateAsync,
        isLoadingMLRecommendations: recommendMLMutation.isPending,
        mlRecommendationsError: recommendMLMutation.error?.message || null,
    };
}
