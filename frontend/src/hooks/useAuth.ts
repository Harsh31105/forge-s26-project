import { getAuth } from "@/src/lib/api/auth";
import { getStudent } from "@/src/lib/api/student";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetAuthCallbackParams } from "@/src/lib/api/northStarAPI.schemas";
import { TOKEN_KEY } from "@/src/lib/api/apiClient";

export function useAuthMutations() {
    const authAPI = getAuth();

    const signinMutation = useMutation({
       mutationFn: () => authAPI.getAuthSignin(),
    });

    const callbackMutation = useMutation({
        mutationFn: (params: GetAuthCallbackParams) => authAPI.getAuthCallback(params),
    });

    return {
        signin: signinMutation.mutateAsync,
        handleCallback: callbackMutation.mutateAsync,

        isSigningIn: signinMutation.isPending,
        isHandlingCallback: callbackMutation.isPending,

        signinError: signinMutation.error?.message || null,
        callbackError: callbackMutation.error?.message || null,
    };
}

function getStudentIdFromToken(): string | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.id ?? null;
    } catch {
        return null;
    }
}

export function useCurrentUser() {
    const studentAPI = getStudent();
    const studentId = getStudentIdFromToken();

    const { data, isLoading, error } = useQuery({
        queryKey: ["currentUser", studentId],
        queryFn: () => studentAPI.getStudentsId(studentId!),
        enabled: !!studentId,
        retry: false,
    });

    return {
        user: data ?? null,
        firstName: data?.firstName ?? null,
        isLoading,
        error: error?.message || null,
    };
}