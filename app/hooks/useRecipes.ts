import { $api } from "@/src/lib/api/client";
import { useUser } from "./useUser";

export const useRecipes = () => {
  const { token } = useUser();

  const query = $api.useQuery(
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

  console.log("Recipes data:", query.data);

  return query;
};
