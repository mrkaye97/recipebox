import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import Storage from "react-native-storage";

type UseStorageProps = {
  syncCallback: (params: any) => Promise<any>;
};

export const useStorage = ({ syncCallback }: UseStorageProps) => {
  const storage = new Storage({
    size: 1000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24 * 31,
    enableCache: true,
    sync: async (params: any) => {
      await syncCallback(params);
    },
  });

  const [token, setToken] = useState<string | null>(null);

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
        console.error("Error saving token:", error);
      }
    },
    [storage],
  );

  const getToken = useCallback(async () => {
    try {
      const result = await storage.load({
        key: "auth:token",
        autoSync: true,
        syncInBackground: true,
      });
      setToken(result.token);
      return result.token;
    } catch (error) {
      console.error("Error loading token:", error);
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
      console.error("Error removing token:", error);
    }
  }, [storage]);

  // Load token on hook initialization
  useEffect(() => {
    getToken();
  }, [getToken]);

  return {
    token,
    saveToken,
    getToken,
    removeToken,
  };
};
