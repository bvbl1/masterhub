"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  authApi,
  getToken,
  clearToken,
  type User,
  type RegisterRequest,
} from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (
    emailOrPhone: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (emailOrPhone: string, password: string, rememberMe = false) => {
      await authApi.login(
        { email_or_phone: emailOrPhone, password },
        { rememberMe },
      );
      const me = await authApi.getMe();
      setUser(me);
    },
    [],
  );

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
