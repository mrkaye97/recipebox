import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";

export function getStoredToken(): string | null {
  return localStorage.getItem("recipebox_token");
}

export function storeToken(token: string) {
  localStorage.setItem("recipebox_token", token);
}

export function clearToken() {
  localStorage.removeItem("recipebox_token");
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => {
    const t = getStoredToken();
    if (t && !isTokenExpired(t)) return t;
    clearToken();
    return null;
  });

  const handleLogout = () => {
    clearToken();
    setToken(null);
  };

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode<{ sub: string }>(token).sub;
    } catch {
      return null;
    }
  }, [token]);

  return { setToken, handleLogout, authHeaders, userId };
};
