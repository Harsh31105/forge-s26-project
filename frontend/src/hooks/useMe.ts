import { getMe } from "@/src/lib/api/me";
import { useQuery } from "@tanstack/react-query";

export function useMe() {
    const meAPI = getMe();

    const { data: student, isLoading, isFetching, error } = useQuery({
        queryKey: ["me"],
        queryFn: () => meAPI.getAuthMe(),
        staleTime: 0,
    });

    return { student, isLoading, isFetching, error: error?.message || null };
}
