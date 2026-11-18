import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isBlocked, subscribeBlockers } from "./blockers";
import { fetchNewVersion, page, type AppVersion } from "./version";

/** Checagem com a aba visível (plan P16): "em até 5 minutos" depois da publicação (RF-014). */
export const CHECK_INTERVAL_MS = 4 * 60_000;
/** Fora do app por mais que isto: ao voltar, recarrega sozinho (RF-017d). */
export const AWAY_LIMIT_MS = 30 * 60_000;

const AUTO_RELOAD_KEY = "habits:auto-reload";

type Status = "loading" | "anonymous" | "authenticated";

interface UpdateValue {
  /** Versão nova publicada e ainda não carregada (mostra o aviso). */
  available: AppVersion | null;
  /** "Atualizar" foi tocado com um diálogo aberto: recarrega quando ele fechar. */
  pending: boolean;
  update: () => void;
}

const UpdateContext = createContext<UpdateValue>({ available: null, pending: false, update: () => undefined });

/**
 * Versão nova (spec 011, US3/US4, plan P16–P18): confere o servidor de tempos em tempos e decide
 * entre recarregar sozinho e mostrar o aviso. Nunca recarrega com bloqueio (diálogo, arraste,
 * alteração em andamento, campos de entrar preenchidos).
 */
export function UpdateProvider({ status, children }: { status: Status; children: ReactNode }) {
  const [available, setAvailable] = useState<AppVersion | null>(null);
  const [pending, setPending] = useState(false);
  const statusRef = useRef(status);
  const availableRef = useRef<AppVersion | null>(null);
  const hiddenAt = useRef<number | null>(null);

  /** Recarga sem pedir: no máximo uma por versão na sessão (evita laço se o servidor ainda servir a antiga). */
  const autoReload = useCallback((version: AppVersion): boolean => {
    if (isBlocked()) return false;
    try {
      if (sessionStorage.getItem(AUTO_RELOAD_KEY) === version.version) return false;
      sessionStorage.setItem(AUTO_RELOAD_KEY, version.version);
    } catch {
      // sem sessionStorage: recarrega mesmo assim
    }
    page.reload();
    return true;
  }, []);

  const check = useCallback(async (auto: boolean) => {
    const found = await fetchNewVersion();
    if (!found) return;
    // Na tela Entrar/Criar conta (sem nada digitado) a versão nova entra sozinha (RF-017c)
    if ((auto || statusRef.current === "anonymous") && autoReload(found)) return;
    availableRef.current = found;
    setAvailable(found);
  }, [autoReload]);

  // Abertura do zero (RF-017a): normalmente já é a versão nova; se não for, recarrega
  useEffect(() => {
    void check(true);
  }, [check]);

  // Logo depois de entrar (RF-017b)
  useEffect(() => {
    const previous = statusRef.current;
    statusRef.current = status;
    if (previous === "anonymous" && status === "authenticated") void check(true);
  }, [status, check]);

  // A cada 4 minutos com a aba visível, e ao voltar para ela (RF-014, RF-017d)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void check(false);
    }, CHECK_INTERVAL_MS);
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current === null ? 0 : Date.now() - hiddenAt.current;
      hiddenAt.current = null;
      const known = availableRef.current;
      if (away >= AWAY_LIMIT_MS && known && autoReload(known)) return;
      void check(away >= AWAY_LIMIT_MS);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check, autoReload]);

  // "Atualizar" pendente: recarrega assim que o último bloqueio sair (RF-016)
  useEffect(() => subscribeBlockers(() => {
    if (pending && !isBlocked()) page.reload();
  }), [pending]);

  const update = useCallback(() => {
    if (isBlocked()) setPending(true);
    else page.reload();
  }, []);

  return <UpdateContext.Provider value={{ available, pending, update }}>{children}</UpdateContext.Provider>;
}

export function useUpdate(): UpdateValue {
  return useContext(UpdateContext);
}
