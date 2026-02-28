import { getSample } from "@/src/lib/api/sample";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {GetSamplesParams, SamplePostInput} from "@/src/lib/api/northStarAPI.schemas";

export function useSamples(params?: GetSamplesParams) {
    const sampleAPI = getSample()

    const {
        data: samplesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["sample", params],
        queryFn: () => sampleAPI.getSamples(params),
    });

    return { samples: samplesData || [], isLoading, error: error?.message || null, refetch };
}

export function useSample(sampleID: string) {
    const sampleAPI = getSample();

    const {
        data: sample,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["samples", sampleID],
        queryFn: () => sampleAPI.getSamplesId(sampleID),
        enabled: !!sampleID // TODO: Why?
    })

    return { sample, isLoading, error: error?.message || null, refetch };
}

export function useSampleMutations() {
    const queryClient = useQueryClient();
    const sampleAPI = getSample();

    const createMutation = useMutation({
        mutationFn: (input: SamplePostInput) => sampleAPI.postSamples(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["samples"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ sampleID, input }: {
            sampleID: string;
            input: SamplePostInput;
        }) => sampleAPI.patchSamplesId(sampleID, input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["samples"] });
            queryClient.invalidateQueries({ queryKey: ["samples", variables.sampleID] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (sampleID: string) => sampleAPI.deleteSamplesId(sampleID),
        onSuccess: (_, sampleID) => {
            queryClient.invalidateQueries({ queryKey: ["samples"] });
            queryClient.removeQueries({ queryKey: ["samples", sampleID] });
        }
    });

    return {
        createSample: createMutation.mutateAsync,
        updateSample: updateMutation.mutateAsync,
        deleteSample: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}
