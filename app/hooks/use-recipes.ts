import { $api } from "@/src/lib/api/client";
import { components } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
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

export const useRecipes = () => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const recipeQuery = $api.useQuery(
    "get",
    "/recipes",
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
            body: formData as any, // TypeScript workaround for FormData
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

  return {
    ...recipeQuery,
    create: {
      perform: createRecipe,
      isPending: onlinePending || madeUpPending || cookbookPending,
      isError,
    },
  };
};
