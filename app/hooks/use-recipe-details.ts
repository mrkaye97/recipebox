import { $api } from "@/src/lib/api/client";
import { useUser } from "./use-user";

export const useRecipeDetails = (
  id: string,
  belongsToFriendUserId?: string | null,
) => {
  const { token } = useUser();

  return $api.useQuery(
    "get",
    "/recipes/{id}",
    {
      params: {
        path: { id: id! },
        query: belongsToFriendUserId
          ? { belongs_to_friend_user_id: belongsToFriendUserId }
          : {},
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
