import { getCourseReview } from "../lib/api/course-review";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CourseThreadPatchInput, CourseThreadPostInput, GetCourseReviewsIdThreadsParams, UuidParam } from "@/src/lib/api/northStarAPI.schemas";

export function useCourseThreads(courseReviewId: UuidParam, params?: GetCourseReviewsIdThreadsParams) {
    const courseReviewAPI = getCourseReview();

    const {
        data: threadsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["courseThreads", courseReviewId, params],
        queryFn: () => courseReviewAPI.getCourseReviewsIdThreads(courseReviewId, params),
        enabled: !!courseReviewId,
    });

    return { threads: threadsData || [], isLoading, error: error?.message || null, refetch };
}

export function useCourseThreadMutations(courseReviewId: UuidParam) {
    const queryClient = useQueryClient();
    const courseReviewAPI = getCourseReview();

    const createMutation = useMutation({
        mutationFn: (input: CourseThreadPostInput) =>
            courseReviewAPI.postCourseReviewsIdThreads(courseReviewId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courseThreads", courseReviewId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ threadId, input }: { threadId: UuidParam; input: CourseThreadPatchInput }) =>
            courseReviewAPI.patchCourseReviewsCourseReviewIdThreadsThreadId(courseReviewId, threadId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courseThreads", courseReviewId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (threadId: UuidParam) =>
            courseReviewAPI.deleteCourseReviewsCourseReviewIdThreadsThreadId(courseReviewId, threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courseThreads", courseReviewId] });
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