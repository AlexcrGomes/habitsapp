import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, api, setUnauthenticatedHandler } from "../api/client";
import type { User } from "../api/types";

type Status = "loading" | "anonymous" | "authenticated";

interface AuthValue {
  status: Status;
  user: User | null;
  /** Aviso para a tela de login (ex.: sessão expirada). */
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export const SESSION_EXPIRED = "Sua sessão expirou. Entre novamente.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const statusRef = useRef<Status>("loading");

  const apply = useCallback((next: User | null) => {
    const nextStatus: Status = next ? "authenticated" : "anonymous";
    statusRef.current = nextStatus;
    setUser(next);
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      if (statusRef.current === "authenticated") setNotice(SESSION_EXPIRED);
      apply(null);
    });
    api.me().then(apply, (e) => {
      // 401 é só "não logado"; outros erros (API fora do ar, rede) merecem aviso
      if (!(e instanceof ApiError && e.status === 401)) {
        setNotice("Não foi possível falar com o servidor. Tente novamente em instantes.");
      }
      apply(null);
    });
    return () => setUnauthenticatedHandler(null);
  }, [apply]);

  const login = useCallback(async (email: string, password: string) => {
    const logged = await api.login(email, password);
    setNotice(null);
    apply(logged);
  }, [apply]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const created = await api.register(name, email, password);
    setNotice(null);
    apply(created);
  }, [apply]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setNotice(null);
      apply(null);
    }
  }, [apply]);

  return (
    <AuthContext.Provider value={{ status, user, notice, login, register, logout, updateUser: apply }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return value;
}
