import { getAcademic } from "@/src/lib/api/academic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customAxios } from "@/src/lib/api/apiClient";

export function useMajors() {
    const academicAPI = getAcademic();

    const { data, isLoading, error } = useQuery({
        queryKey: ["academic", "majors"],
        queryFn: () => academicAPI.getAcademicMajors(),
    });

    return { majors: data ?? [], isLoading, error: error?.message ?? null };
}

export function useConcentrations() {
    const academicAPI = getAcademic();

    const { data, isLoading, error } = useQuery({
        queryKey: ["academic", "concentrations"],
        queryFn: () => academicAPI.getAcademicConcentrations(),
    });

    return { concentrations: data ?? [], isLoading, error: error?.message ?? null };
}

export function useMinors() {
    const academicAPI = getAcademic();

    const { data, isLoading, error } = useQuery({
        queryKey: ["academic", "minors"],
        queryFn: () => academicAPI.getAcademicMinors(),
    });

    return { minors: data ?? [], isLoading, error: error?.message ?? null };
}

export function useStudentAcademicMutations(studentID: string) {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["students", studentID] });
        queryClient.invalidateQueries({ queryKey: ["students"] });
    };

    const addMajor = useMutation({
        mutationFn: (majorId: number) =>
            customAxios({ url: `/students/${studentID}/majors`, method: "POST", data: { majorId } }),
        onSuccess: invalidate,
    });

    const removeMajor = useMutation({
        mutationFn: (majorId: number) =>
            customAxios({ url: `/students/${studentID}/majors/${majorId}`, method: "DELETE" }),
        onSuccess: invalidate,
    });

    const addConcentration = useMutation({
        mutationFn: (concentrationId: number) =>
            customAxios({
                url: `/students/${studentID}/concentrations`,
                method: "POST",
                data: { concentrationId },
            }),
        onSuccess: invalidate,
    });

    const removeConcentration = useMutation({
        mutationFn: (concentrationId: number) =>
            customAxios({
                url: `/students/${studentID}/concentrations/${concentrationId}`,
                method: "DELETE",
            }),
        onSuccess: invalidate,
    });

    const addMinor = useMutation({
        mutationFn: (minorId: number) =>
            customAxios({ url: `/students/${studentID}/minors`, method: "POST", data: { minorId } }),
        onSuccess: invalidate,
    });

    const removeMinor = useMutation({
        mutationFn: (minorId: number) =>
            customAxios({ url: `/students/${studentID}/minors/${minorId}`, method: "DELETE" }),
        onSuccess: invalidate,
    });

    return {
        addMajor: addMajor.mutateAsync,
        removeMajor: removeMajor.mutateAsync,
        addConcentration: addConcentration.mutateAsync,
        removeConcentration: removeConcentration.mutateAsync,
        addMinor: addMinor.mutateAsync,
        removeMinor: removeMinor.mutateAsync,

        isAddingMajor: addMajor.isPending,
        isRemovingMajor: removeMajor.isPending,
        isAddingConcentration: addConcentration.isPending,
        isRemovingConcentration: removeConcentration.isPending,
        isAddingMinor: addMinor.isPending,
        isRemovingMinor: removeMinor.isPending,
    };
}