"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from "@/lib/api/auth-token";

type UserRole = "CUSTOMER" | "CONTRACTOR";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user?: AuthUser | null) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getAccessToken();
    setTokenState(storedToken);
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser?: AuthUser | null) => {
    setAccessToken(newToken);
    setTokenState(newToken);

    if (newUser !== undefined) {
      setUser(newUser);
    }
  };

  const logout = () => {
    removeAccessToken();
    setTokenState(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      setUser,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
