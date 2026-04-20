import { getMe } from "../lib/api/me";
import { useQuery } from "@tanstack/react-query";

export function useMe() {
    const meAPI = getMe();

    const { data: student, isLoading, error } = useQuery({
        queryKey: ["me"],
        queryFn: () => meAPI.getAuthMe(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    return { student, isLoading, error: error?.message || null };
}
