import { $api, fetchClient } from "@/src/lib/api/client";
import { components, paths } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useUser } from "./use-user";

export type Who = paths["/activity"]["get"]["parameters"]["query"]["who"];
type ActivityItem = components["schemas"]["ListRecentRecipeCooksRow"];
type InfiniteQueryData = {
  pages: ActivityItem[][];
  pageParams: number[];
};

const ITEMS_PER_PAGE = 20;

export const useActivity = ({ who }: { who: Who }) => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: isRecentCooksLoading,
    isError: isRecentCooksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = $api.useInfiniteQuery(
    "get",
    "/activity",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        query: {
          who,
          limit: ITEMS_PER_PAGE,
          offset: 0,
        },
      },
    },
    {
      enabled: !!token,
      placeholderData: (previousData: InfiniteQueryData | undefined) =>
        previousData,
      initialPageParam: 0,
      getNextPageParam: (
        lastPage: ActivityItem[],
        allPages: ActivityItem[][],
      ) => {
        if (!lastPage || lastPage.length < ITEMS_PER_PAGE) {
          return undefined;
        }
        return allPages.reduce(
          (total: number, page: ActivityItem[]) => total + page.length,
          0,
        );
      },
      queryFn: async ({ pageParam = 0 }) => {
        const response = await fetchClient.GET("/activity", {
          params: {
            query: {
              who,
              limit: ITEMS_PER_PAGE,
              offset: pageParam,
            },
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.error) {
          throw new Error("Failed to fetch activity");
        }

        return response.data;
      },
    },
  );

  const recentCooks = useMemo(() => {
    return data?.pages?.flat() || [];
  }, [data]);

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

  const { mutateAsync: deleteActivity, isPending: isDeletingActivity } =
    $api.useMutation("delete", "/activity/{recipe_id}", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/activity"],
        });
      },
    });

  const deleteActivityEntry = useCallback(
    async (recipeId: string, cookedAt: string) => {
      return await deleteActivity({
        params: {
          path: {
            recipe_id: recipeId,
          },
          query: {
            cooked_at: cookedAt,
          },
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [deleteActivity, token],
  );
  return {
    recentCooks,
    isRecentCooksLoading,
    isRecentCooksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    markAsCookedRecently: {
      perform: markAsCookedRecently,
      isPending: isMarkingCooked,
    },
    deleteActivity: {
      perform: deleteActivityEntry,
      isPending: isDeletingActivity,
    },
  };
};
