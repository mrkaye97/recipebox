import { $api } from "@/src/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "./use-user";

export const useFriends = ({ query }: { query: string }) => {
  const { token } = useUser();
  const queryClient = useQueryClient();

  const userSearchQuery = $api.useQuery(
    "get",
    "/users/search",
    {
      params: {
        query: {
          query,
        },
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token && !!query,
    },
  );

  const friendRequestsQuery = $api.useQuery(
    "get",
    "/users/friend-requests",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );

  const friendsQuery = $api.useQuery(
    "get",
    "/users/friends",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token,
    },
  );

  const { mutateAsync: sendFriendRequest, isPending: sendingRequest } =
    $api.useMutation("post", "/users/friend-request", {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["get", "/users/friend-requests"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["get", "/users/friends"],
        });
      },
    });

  const { mutateAsync: acceptFriendRequest, isPending: acceptingRequest } =
    $api.useMutation(
      "post",
      "/users/friend-request/{request_from_user_id}/accept",
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["get", "/users/friend-requests"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["get", "/users/friends"],
          });
        },
      },
    );

  const sendRequest = useCallback(
    async (friendUserId: string) => {
      if (!token) throw new Error("Not authenticated");

      return await sendFriendRequest({
        body: {
          friend_user_id: friendUserId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [sendFriendRequest, token],
  );

  const acceptRequest = useCallback(
    async (requestFromUserId: string) => {
      if (!token) throw new Error("Not authenticated");

      return await acceptFriendRequest({
        params: {
          path: {
            request_from_user_id: requestFromUserId,
          },
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [acceptFriendRequest, token],
  );

  return {
    search: userSearchQuery,
    requests: friendRequestsQuery,
    friends: friendsQuery,
    sendRequest,
    acceptRequest,
    sendingRequest,
    acceptingRequest,
  };
};
