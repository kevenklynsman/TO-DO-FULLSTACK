"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await api.me();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await api.logout();
      setUser(null);
      router.push("/todos");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login: useCallback(
      async (email: string, password: string) => {
        try {
          setLoading(true);
          await api.login(email, password);
          await checkAuth();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erro ao fazer login";
          throw new Error(message);
        } finally {
          setLoading(false);
        }
      },
      [checkAuth],
    ),
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider");
  }
  return context;
}
