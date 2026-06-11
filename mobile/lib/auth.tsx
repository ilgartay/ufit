import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, apiPublic, saveToken, getToken, clearToken } from "./api";

export type Member = {
  id: string;
  tckn: string;
  fullName: string;
  phone: string;
  status: string;
  active: boolean;
  expired: boolean;
  daysLeft: number;
  membershipStart: string;
  membershipEnd: string;
};

type LoginResp = {
  token: string;
  mustChangePassword: boolean;
  member: Member;
};

type AuthState = {
  loading: boolean;
  member: Member | null;
  mustChangePassword: boolean;
  login: (tckn: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setMustChangePassword: (v: boolean) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setMember(null);
      return;
    }
    try {
      const res = await api<{ member: Member }>("/me");
      setMember(res.member);
    } catch {
      await clearToken();
      setMember(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (tckn: string, password: string) => {
    const res = await apiPublic<LoginResp>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ tckn, password }),
    });
    await saveToken(res.token);
    setMember(res.member);
    setMustChangePassword(res.mustChangePassword);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setMember(null);
    setMustChangePassword(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        member,
        mustChangePassword,
        login,
        logout,
        setMustChangePassword,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
