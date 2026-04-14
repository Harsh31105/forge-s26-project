import { getCourse } from "../lib/api/course";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoursePatchInput, CoursePostInput, GetCoursesParams } from "@/src/lib/api/northStarAPI.schemas";

export function useCourses(params?: GetCoursesParams) {
    const courseAPI = getCourse();

    const {
        data: coursesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["courses", params],
        queryFn: () => courseAPI.getCourses(params)
    });

    return { courses: coursesData || [], isLoading, error: error?.message || null, refetch };
}

export function useCourse(courseId: string) {
    const courseAPI = getCourse();

    const {
        data: course,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["courses", courseId],
        queryFn: () => courseAPI.getCoursesId(courseId),
        enabled: !!courseId,
    });

    return { course, isLoading, error: error?.message || null, refetch };
}

export function useCourseFavourites(courseId: string) {
    const courseAPI = getCourse();

    const {
        data: favouritesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["courses", courseId, "favourites"],
        queryFn: () => courseAPI.getCoursesIdFavourites(courseId),
        enabled: !!courseId,
    });

    return { favourites: favouritesData || [], isLoading, error: error?.message || null, refetch };
}

export function useCourseMutations() {
    const queryClient = useQueryClient();
    const courseAPI = getCourse();

    const createMutation = useMutation({
        mutationFn: (input: CoursePostInput) => courseAPI.postCourses(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ courseId, input }: { courseId: string; input: CoursePatchInput }) =>
            courseAPI.patchCoursesId(courseId, input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.invalidateQueries({ queryKey: ["courses", variables.courseId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (courseId: string) => courseAPI.deleteCoursesId(courseId),
        onSuccess: (_, courseId) => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.removeQueries({ queryKey: ["courses", courseId] });
        },
    });

    return {
        createCourse: createMutation.mutateAsync,
        updateCourse: updateMutation.mutateAsync,
        deleteCourse: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}

export function useBestProfessors(courseId: string) {
    const courseAPI = getCourse();

    const {
        data: professorsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["courses", courseId, "best-professors"],
        queryFn: () => courseAPI.getCoursesIdBestProfessors(courseId),
        enabled: !!courseId,
    });

    return { professors: professorsData || [], isLoading, error: error?.message || null, refetch };
}