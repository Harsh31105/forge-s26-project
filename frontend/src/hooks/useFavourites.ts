import { getFavourite } from "../lib/api/favourite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FavoritePostInput } from "@/src/lib/api/northStarAPI.schemas";

export function useFavourites() {
    const favouriteAPI = getFavourite();

    const {
        data: favouritesData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["favourites"],
        queryFn: () => favouriteAPI.getFavourites(),
    });

    return { favourites: favouritesData || [], isLoading, error: error?.message || null, refetch };
}

export function useFavouriteMutations() {
    const queryClient = useQueryClient();
    const favouriteAPI = getFavourite();

    const createMutation = useMutation({
        mutationFn: (input: FavoritePostInput) => favouriteAPI.postFavourites(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favourites"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (courseId: string) => favouriteAPI.deleteFavouritesId(courseId),
        onSuccess: (_, courseId) => {
            queryClient.invalidateQueries({ queryKey: ["favourites"] });
            queryClient.invalidateQueries({ queryKey: ["courses", courseId, "favourites"] });
        },
    });

    return {
        addFavourite: createMutation.mutateAsync,
        removeFavourite: deleteMutation.mutateAsync,

        isAdding: createMutation.isPending,
        isRemoving: deleteMutation.isPending,

        addError: createMutation.error?.message || null,
        removeError: deleteMutation.error?.message || null,
    };
}