import { getProfessorReview } from "../lib/api/professor-review";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetProfessorReviewsIdThreadsParams, ProfThreadPatchInput, ProfThreadPostInput, UuidParam } from "@/src/lib/api/northStarAPI.schemas";

export function useProfThreads(professorReviewId: UuidParam, params?: GetProfessorReviewsIdThreadsParams) {
    const professorReviewAPI = getProfessorReview();

    const {
        data: threadsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["profThreads", professorReviewId, params],
        queryFn: () => professorReviewAPI.getProfessorReviewsIdThreads(professorReviewId, params),
        enabled: !!professorReviewId,
    });

    return { threads: threadsData || [], isLoading, error: error?.message || null, refetch };
}

export function useProfThreadMutations(professorReviewId: UuidParam) {
    const queryClient = useQueryClient();
    const professorReviewAPI = getProfessorReview();

    const createMutation = useMutation({
        mutationFn: (input: ProfThreadPostInput) =>
            professorReviewAPI.postProfessorReviewsIdThreads(professorReviewId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profThreads", professorReviewId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ threadId, input }: { threadId: UuidParam; input: ProfThreadPatchInput }) =>
            professorReviewAPI.patchProfessorReviewsProfessorReviewIdThreadsThreadId(professorReviewId, threadId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profThreads", professorReviewId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (threadId: UuidParam) =>
            professorReviewAPI.deleteProfessorReviewsProfessorReviewIdThreadsThreadId(professorReviewId, threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profThreads", professorReviewId] });
        },
    });

    return {
        createThread: createMutation.mutateAsync,
        updateThread: updateMutation.mutateAsync,
        deleteThread: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}