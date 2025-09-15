import { $api } from "@/src/lib/api/client";
import { components } from "@/src/lib/api/v1";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Storage from "react-native-storage";

type AccessToken = string;
type User = components["schemas"]["src__crud__models__User"];

export type PrivacyPreference = components["schemas"]["UserPrivacyPreference"];
export const PrivacyPreferences: PrivacyPreference[] = ["public", "private"];
interface TokenPayload {
  sub: string; // user ID
  exp: number;
  [key: string]: any;
}

interface UserContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginPending: boolean;
  isRegisterPending: boolean;
  isInitialized: boolean;
  userId: string | null;
  userInfo: User | null;
  login: (username: string, password: string) => Promise<AccessToken>;
  register: (
    email: string,
    name: string,
    password: string,
    privacy_preference: PrivacyPreference,
    signup_token: string
  ) => Promise<AccessToken>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  saveToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode<TokenPayload>(token).sub;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, [token]);

  const storage = useMemo(
    () =>
      new Storage({
        size: 1000,
        storageBackend: AsyncStorage,
        defaultExpires: 1000 * 3600 * 24 * 31,
        enableCache: true,
      }),
    []
  );

  const { mutateAsync: loginMutation, isPending: isLoginPending } =
    $api.useMutation("post", "/auth/login");

  const { mutateAsync: registerMutation, isPending: isRegisterPending } =
    $api.useMutation("post", "/auth/register");

  const { data: userInfo, isLoading: isUserInfoLoading } = $api.useQuery(
    "get",
    "/users",
    {
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
      },
    },
    {
      enabled: !!token,
    }
  );

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
      } catch {}
    },
    [storage]
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
    [loginMutation, saveToken]
  );

  const register = useCallback(
    async (
      email: string,
      name: string,
      password: string,
      privacy_preference: PrivacyPreference,
      signup_token: string
    ): Promise<AccessToken> => {
      const { access_token } = await registerMutation({
        body: {
          email,
          name,
          password,
          privacy_preference,
          signup_token,
        },
      });

      if (access_token) {
        await saveToken(access_token);
      }

      return access_token;
    },
    [registerMutation, saveToken]
  );

  const logout = useCallback(async () => {
    await removeToken();
    queryClient.clear();
  }, [removeToken, queryClient]);

  useEffect(() => {
    const initializeAuth = async () => {
      await getToken();
      setIsInitialized(true);
    };

    initializeAuth();
  }, [getToken]);

  const isAuthenticated = !!token;
  const isLoading =
    isLoginPending || isRegisterPending || !isInitialized || isUserInfoLoading;

  const value: UserContextType = {
    token,
    isAuthenticated,
    isLoading,
    isLoginPending,
    isRegisterPending,
    isInitialized,
    userId,
    userInfo: userInfo ?? null,
    login,
    register,
    logout,
    getToken,
    saveToken,
    removeToken,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
