import { $api } from "@/src/lib/api/client";
import { components, paths } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDebounce } from "use-debounce";
import { useUser } from "./use-user";

type CreateMadeUpRecipeProps =
  components["schemas"]["CreateMadeUpRecipeLocation"];
type CreateOnlineRecipeProps =
  components["schemas"]["CreateOnlineRecipeLocation"];
type CreateCookbookRecipeProps =
  components["schemas"]["Body_create_cookbook_recipe_recipes_cookbook_post"];
type CreateRecipeProps =
  | CreateMadeUpRecipeProps
  | CreateOnlineRecipeProps
  | CreateCookbookRecipeProps;

export const useRecipes = ({
  search,
}: {
  search?: string;
} = {}) => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const [debouncedSearch] = useDebounce(search || "", 300);

  const recipeQuery = $api.useQuery(
    "get",
    "/recipes",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        query: {
          search: debouncedSearch || undefined,
        },
      },
    },
    {
      enabled: !!token,
      placeholderData: (previousData) => previousData,
    },
  );

  const recommendedRecipeQuery = $api.useQuery(
    "get",
    "/recipes/recommendation",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );

  const { mutateAsync: createOnlineRecipe, isPending: onlinePending } =
    $api.useMutation("post", "/recipes/online", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        });
      },
    });

  const { mutateAsync: createMadeUpRecipe, isPending: madeUpPending } =
    $api.useMutation("post", "/recipes/made-up", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        });
      },
    });

  const {
    mutateAsync: createCookbookRecipe,
    isPending: cookbookPending,
    isError,
  } = $api.useMutation("post", "/recipes/cookbook", {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["get", "/recipes"],
      });
    },
  });

  const { mutateAsync: updateRecipeMutation, isPending: updatePending } =
    $api.useMutation("patch", "/recipes/{id}", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        });
      },
    });

  const updateRecipe = useCallback(async (id: string, body: paths["/recipes/{id}"]["patch"]["requestBody"]["content"]["application/json"]) => {
    await updateRecipeMutation({
      body,
      params: {
        path: {
          id
        }
      },
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
  }, [updateRecipeMutation, token]);

  const { mutateAsync: shareRecipe, isPending: sharePending } =
    $api.useMutation("post", "/sharing", {
      onSuccess: async () => {
        // Could invalidate shared recipes query if we had one
      },
    });

  const { mutateAsync: acceptRecipeShare, isPending: acceptPending } =
    $api.useMutation("post", "/sharing/accept", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes/share"],
        });
      },
    });

  const pendingSharesQuery = $api.useQuery(
    "get",
    "/sharing",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );

  const createRecipe = useCallback(
    async (props: CreateRecipeProps) => {
      switch (props.location) {
        case "online":
          return await createOnlineRecipe({
            body: props,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        case "made_up":
          return await createMadeUpRecipe({
            body: props,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        case "cookbook":
          const formData = new FormData();
          formData.append("file", props.file);
          formData.append("location", "cookbook");
          formData.append("author", props.author);
          formData.append("cookbook_name", props.cookbook_name);
          formData.append("page_number", props.page_number.toString());
          if (props.notes) {
            formData.append("notes", props.notes);
          }

          return await createCookbookRecipe({
            body: formData as any,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        default:
          throw new Error("Invalid recipe location");
      }
    },
    [createOnlineRecipe, createMadeUpRecipe, createCookbookRecipe, token],
  );

  const shareRecipeWithFriend = useCallback(
    async (recipeId: string, friendUserId: string) => {
      if (!token) throw new Error("Not authenticated");

      return await shareRecipe({
        body: {
          recipe_id: recipeId,
          to_user_id: friendUserId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [shareRecipe, token],
  );

  const acceptRecipeShareRequest = useCallback(
    async (shareToken: string) => {
      if (!token) throw new Error("Not authenticated");

      return await acceptRecipeShare({
        body: {
          token: shareToken,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [acceptRecipeShare, token],
  );

  return {
    ...recipeQuery,
    create: {
      perform: createRecipe,
      isPending: onlinePending || madeUpPending || cookbookPending,
      isError,
    },
    shareRecipe: {
      perform: shareRecipeWithFriend,
      isPending: sharePending,
    },
    acceptShare: {
      perform: acceptRecipeShareRequest,
      isPending: acceptPending,
    },
    pendingShares: {
      data: pendingSharesQuery.data,
      isLoading: pendingSharesQuery.isLoading,
      isError: pendingSharesQuery.isError,
      refetch: pendingSharesQuery.refetch,
    },
    recommendation: {
      ...recommendedRecipeQuery,
    },
    updateRecipe: {
      perform: updateRecipe,
      isPending: updatePending,
    }
  };
};
