import { $api } from "@/src/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "./use-user";

export const useActivity = () => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const {
    data: recentCooks = [],
    isLoading: isRecentCooksLoading,
    isError: isRecentCooksError,
  } = $api.useQuery(
    "get",
    "/activity/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );

  const { mutateAsync: markCooked, isPending: isMarkingCooked } =
    $api.useMutation("post", "/activity", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/activity/me"],
        });
      },
    });

  const markAsCookedRecently = useCallback(
    async (recipeId: string) => {
      return await markCooked({
        body: {
          recipe_id: recipeId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [markCooked, token],
  );
  return {
    recentCooks,
    isRecentCooksLoading,
    isRecentCooksError,
    markAsCookedRecently: {
      perform: markAsCookedRecently,
      isPending: isMarkingCooked,
    },
  };
};
