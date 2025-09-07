import { $api } from "@/src/lib/api/client";
import { useUser } from "./use-user";

export const useRecipeDetails = (id: string) => {
  const { token } = useUser();

  return $api.useQuery(
    "get",
    "/recipes/{id}",
    {
      params: {
        path: { id },
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token && !!id,
    },
  );
};
