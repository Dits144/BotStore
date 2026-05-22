import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthSession, LinkedGroup } from "./api";
import { linkAdditionalGroup, loginRequest } from "./api";

const STORAGE_KEY = "wa-bot-dashboard:session:v1";
const ACTIVE_KEY = "wa-bot-dashboard:active-group:v1";

interface AuthContextValue {
  session: AuthSession | null;
  activeGroup: LinkedGroup | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchGroup: (token: string) => void;
  addGroup: (groupToken: string, groupPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        setSession(parsed);
        const active = localStorage.getItem(ACTIVE_KEY);
        setActiveToken(active || parsed.groups[0]?.token || null);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AuthSession | null, active?: string | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (active !== undefined) {
      if (active) localStorage.setItem(ACTIVE_KEY, active);
      else localStorage.removeItem(ACTIVE_KEY);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const next = await loginRequest(email, password);
      setSession(next);
      if (next.groups.length > 0) {
        setActiveToken(next.groups[0].token);
        persist(next, next.groups[0].token);
      } else {
        setActiveToken(null);
        persist(next, null);
      }
    },
    [persist],
  );

  const logout = useCallback(() => {
    setSession(null);
    setActiveToken(null);
    persist(null, null);
  }, [persist]);

  const switchGroup = useCallback(
    (token: string) => {
      setActiveToken(token);
      localStorage.setItem(ACTIVE_KEY, token);
    },
    [],
  );

  const addGroup = useCallback(
    async (groupToken: string, groupPassword?: string) => {
      if (!session) return;
      if (session.groups.some((g) => g.token === groupToken)) {
        setActiveToken(groupToken);
        return;
      }
      const linked = await linkAdditionalGroup(groupToken, groupPassword);
      const next = { ...session, groups: [...session.groups, linked] };
      setSession(next);
      setActiveToken(groupToken);
      persist(next, groupToken);
    },
    [session, persist],
  );

  const value = useMemo<AuthContextValue>(() => {
    const activeGroup =
      session?.groups.find((g) => g.token === activeToken) ||
      session?.groups[0] ||
      null;
    return {
      session,
      activeGroup,
      isAuthenticated: !!session && hydrated,
      login,
      logout,
      switchGroup,
      addGroup,
    };
  }, [session, activeToken, hydrated, login, logout, switchGroup, addGroup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
