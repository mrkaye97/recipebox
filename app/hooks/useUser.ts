import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useStorage } from "./useStorage";

export const useUser = () => {
  const { mutateAsync: loginMutation, isPending: isLoginPending } = useMutation(
    {
      mutationKey: ["login"],
      mutationFn: async ({
        username,
        password,
      }: {
        username: string;
        password: string;
      }) => {
        const response = await fetch("http://localhost:8000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username,
            password,
          }).toString(),
        });

        if (!response.ok) {
          throw new Error("Login failed");
        }

        return await response.json();
      },
    },
  );

  const { token, saveToken, getToken, removeToken } = useStorage({
    syncCallback: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const result = await loginMutation({
        username,
        password,
      });
      if (result?.access_token) {
        await saveToken(result.access_token);
      }
      return result;
    },
  });

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginMutation({
      username,
      password,
    });

    if (result?.access_token) {
      await saveToken(result.access_token);
    }

    return result;
  }, [loginMutation, saveToken]);

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
