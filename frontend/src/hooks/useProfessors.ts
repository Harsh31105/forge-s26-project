import { getProfessor } from "../lib/api/professor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetProfessorsParams, ProfessorPatchInput, ProfessorPostInput } from "@/src/lib/api/northStarAPI.schemas";

export function useProfessors(params?: GetProfessorsParams) {
    const professorAPI = getProfessor();

    const {
        data: professorsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["professors", params],
        queryFn: () => professorAPI.getProfessors(params),
    });

    return { professors: professorsData || [], isLoading, error: error?.message || null, refetch };
}

export function useProfessor(professorId: string) {
    const professorAPI = getProfessor();

    const {
        data: professor,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["professors", professorId],
        queryFn: () => professorAPI.getProfessorsId(professorId),
        enabled: !!professorId,
    });

    return { professor, isLoading, error: error?.message || null, refetch };
}

export function useProfessorMutations() {
    const queryClient = useQueryClient();
    const professorAPI = getProfessor();

    const createMutation = useMutation({
        mutationFn: (input: ProfessorPostInput) => professorAPI.postProfessors(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ professorId, input }: { professorId: string; input: ProfessorPatchInput }) =>
            professorAPI.patchProfessorsId(professorId, input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
            queryClient.invalidateQueries({ queryKey: ["professors", variables.professorId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (professorId: string) => professorAPI.deleteProfessorsId(professorId),
        onSuccess: (_, professorId) => {
            queryClient.invalidateQueries({ queryKey: ["professors"] });
            queryClient.removeQueries({ queryKey: ["professors", professorId] });
        },
    });

    return {
        createProfessor: createMutation.mutateAsync,
        updateProfessor: updateMutation.mutateAsync,
        deleteProfessor: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}