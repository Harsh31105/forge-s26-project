import { getAuth } from "@/src/lib/api/auth";
import { useMutation } from "@tanstack/react-query";
import { GetAuthCallbackParams } from "@/src/lib/api/northStarAPI.schemas";

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