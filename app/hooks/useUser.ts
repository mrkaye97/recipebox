import { $api } from "@/src/lib/api/client";
import { useCallback } from "react";
import { useStorage } from "./useStorage";

type AccessToken = string;

export const useUser = () => {
  const { mutateAsync: loginMutation, isPending: isLoginPending } =
    $api.useMutation("post", "/auth/login");

  const { token, saveToken, getToken, removeToken } = useStorage({
    syncCallback: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<AccessToken> => {
      const { access_token } = await loginMutation({
        body: {
          username,
          password,
          scope: "read write",
        },
      });

      if (access_token) {
        await saveToken(access_token);
      }
      return access_token;
    },
  });

  const login = useCallback(
    async (username: string, password: string): Promise<AccessToken> => {
      const { access_token } = await loginMutation({
        body: {
          username,
          password,
          scope: "read write",
        },
      });

      if (access_token) {
        await saveToken(access_token);
      }
      return access_token;
    },
    [loginMutation, saveToken],
  );

  const logout = useCallback(async () => {
    await removeToken();
  }, [removeToken]);

  return {
    login,
    logout,
    token,
    getToken,
    isLoginPending,
  };
};
