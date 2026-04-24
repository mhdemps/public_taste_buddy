import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ACTIVE_PROFILE_ID_STORAGE_KEY } from "../userStorage";

export type AuthUser = { id: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  selectProfile: (id: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const id = localStorage.getItem(ACTIVE_PROFILE_ID_STORAGE_KEY)?.trim() ?? "";
      if (id) setUser({ id });
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProfile = useCallback((id: string) => {
    const next = id.trim();
    if (!next) return;
    localStorage.setItem(ACTIVE_PROFILE_ID_STORAGE_KEY, next);
    setUser({ id: next });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      selectProfile,
      signOut,
    }),
    [user, loading, selectProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
