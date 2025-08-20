import { $api } from "@/src/lib/api/client";
import { components } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "./useUser";

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

  const { mutateAsync: createOnlineRecipe } = $api.useMutation(
    "post",
    "/recipes/online",
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        })
      }
    }
  );

  const { mutateAsync: createMadeUpRecipe } = $api.useMutation(
    "post",
    "/recipes/made-up",
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        })
      }
    }
  );

  const {
    mutateAsync: createCookbookRecipe,
    isPending,
    isError,
  } = $api.useMutation("post", "/recipes/cookbook",    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/recipes"],
        })
      }
    }
);

  const createRecipe = useCallback(
    async (props: CreateRecipeProps) => {
      console.log(token)
      switch (props.location) {
        case "online":
          return await createOnlineRecipe({
            body: props,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        case "made_up":
          return await createMadeUpRecipe({
            body: props,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        case "cookbook":
          return await createCookbookRecipe({
            body: props,
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          });
        default:
          throw new Error("Invalid recipe location");
      }
    },
    [createOnlineRecipe, createMadeUpRecipe, createCookbookRecipe],
  );

  return {
    ...recipeQuery,
    create: {
      perform: createRecipe,
      isPending,
      isError,
    },
  };
};
