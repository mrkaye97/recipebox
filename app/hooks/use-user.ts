import { $api } from "@/src/lib/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import Storage from "react-native-storage";

type AccessToken = string;

export const useUser = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const storage = new Storage({
    size: 1000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24 * 31,
    enableCache: true,
  });

  const { mutateAsync: loginMutation, isPending: isLoginPending } =
    $api.useMutation("post", "/auth/login");

  const saveToken = useCallback(
    async (token: string) => {
      try {
        await storage.save({
          key: "auth:token",
          data: {
            token,
          },
        });
        setToken(token);
      } catch (error) {
        // Do nothing
      }
    },
    [storage],
  );

  const getToken = useCallback(async () => {
    try {
      const result = await storage.load({
        key: "auth:token",
        autoSync: false,
      });
      setToken(result.token);
      return result.token;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "NotFoundError"
      ) {
        setToken(null);
        return null;
      }

      setToken(null);
      return null;
    }
  }, [storage]);

  const removeToken = useCallback(async () => {
    try {
      await storage.remove({
        key: "auth:token",
      });
      setToken(null);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "NotFoundError"
      ) {
        setToken(null);
        return;
      }

      setToken(null);
    }
  }, [storage]);

  const login = useCallback(
    async (username: string, password: string): Promise<AccessToken> => {
      const { access_token } = await loginMutation({
        body: {
          username,
          password,
          scope: "read write",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
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

  useEffect(() => {
    const initializeAuth = async () => {
      await getToken();
      setIsInitialized(true);
    };

    initializeAuth();
  }, [getToken]);

  const isAuthenticated = !!token;
  const isLoading = isLoginPending || !isInitialized;

  return {
    token,
    isAuthenticated,
    isLoading,
    isLoginPending,
    isInitialized,

    login,
    logout,

    getToken,
    saveToken,
    removeToken,
  };
};
