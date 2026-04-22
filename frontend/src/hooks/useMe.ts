import { getMe } from "../lib/api/me";
import { getStudent } from "../lib/api/student";
import { useQuery } from "@tanstack/react-query";

export function useMe() {
    const meAPI = getMe();
    const studentAPI = getStudent();

    const { data: authData } = useQuery({
        queryKey: ["me"],
        queryFn: () => meAPI.getAuthMe(),
        refetchOnWindowFocus: false,
        retry: false,
    });

    const studentId = authData?.id ?? null;

    const { data: student, isLoading, error } = useQuery({
        queryKey: ["students", studentId],
        queryFn: () => studentAPI.getStudentsId(studentId!),
        enabled: !!studentId,
        refetchOnWindowFocus: false,
    });

    return { student, isLoading, error: error?.message || null };
}