import {GetTraceParams} from "@/src/lib/api/northStarAPI.schemas";
import { getTrace } from "@/src/lib/api/trace";
import { useQuery } from "@tanstack/react-query";

export function useTraces(params?: GetTraceParams) {
    const traceAPI = getTrace();

    const {
        data: traceData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["traces", params],
        queryFn: () => traceAPI.getTrace(params)
    });

    return { traces: traceData || [], isLoading, error: error?.message || null, refetch }
}