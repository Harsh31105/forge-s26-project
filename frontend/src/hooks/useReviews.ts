import { getReview } from "../lib/api/review";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetReviewsParams, ReviewPatchInput, ReviewPostInput, UuidParam } from "@/src/lib/api/northStarAPI.schemas";

export function useReviews(params?: GetReviewsParams) {
    const reviewAPI = getReview();

    const {
        data: reviewsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["reviews", params],
        queryFn: () => reviewAPI.getReviews(params),
    });

    return { reviews: reviewsData || [], isLoading, error: error?.message || null, refetch };
}

export function useReview(reviewId: UuidParam) {
    const reviewAPI = getReview();

    const {
        data: review,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["reviews", reviewId],
        queryFn: () => reviewAPI.getReviewsId(reviewId),
        enabled: !!reviewId,
    });

    return { review, isLoading, error: error?.message || null, refetch };
}

export function useReviewMutations() {
    const queryClient = useQueryClient();
    const reviewAPI = getReview();

    const createMutation = useMutation({
        mutationFn: (input: ReviewPostInput) => reviewAPI.postReviews(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ reviewId, input }: { reviewId: UuidParam; input: ReviewPatchInput }) =>
            reviewAPI.patchReviewsId(reviewId, input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            queryClient.invalidateQueries({ queryKey: ["reviews", variables.reviewId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (reviewId: UuidParam) => reviewAPI.deleteReviewsId(reviewId),
        onSuccess: (_, reviewId) => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            queryClient.removeQueries({ queryKey: ["reviews", reviewId] });
        },
    });

    return {
        createReview: createMutation.mutateAsync,
        updateReview: updateMutation.mutateAsync,
        deleteReview: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}