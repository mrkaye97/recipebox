import { $api } from "@/src/lib/api/client";
import { paths } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "./use-user";

export type Who = paths["/activity"]["get"]["parameters"]["query"]["who"];

export const useActivity = ({ who }: { who: Who }) => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const {
    data: recentCooks = [],
    isLoading: isRecentCooksLoading,
    isError: isRecentCooksError,
  } = $api.useQuery(
    "get",
    "/activity",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        query: {
          who,
        },
      },
    },
    {
      enabled: !!token,
      placeholderData: (previousData) => previousData,
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
