import { getProfessor } from "@/src/lib/api/professor";
import { getRmp } from "@/src/lib/api/rmp";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useRMP(professorId: string) {
    const professorAPI = getProfessor();

    const {
        data: rmpData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["rmp", professorId],
        queryFn: () => professorAPI.getProfessorsIdRmp(professorId),
        enabled: !!professorId,
    });

    return { rmpData, isLoading, error: error?.message || null, refetch };
}

export function useRMPMutations() {
    const queryClient = useQueryClient();
    const rmpAPI = getRmp();

    const fetchAndSaveMutation = useMutation({
        mutationFn: () => rmpAPI.postRmp(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rmp"] });
        }
    });

    return {
        fetchAndSaveRMP: fetchAndSaveMutation.mutateAsync,
        isFetching: fetchAndSaveMutation.isPending,
        fetchError: fetchAndSaveMutation.error?.message || null,
    };
}