import { useCallback, useSyncExternalStore } from "react";

/**
 * Celular (spec 010, plan P2): tela estreita ou celular deitado (pouca altura). A partir daí a
 * Semana usa a lista empilhada; fora dela, o layout da spec 009 continua igual.
 */
export const MOBILE_QUERY = "(max-width: 639px), (max-height: 499px)";

/** Tela baixa (celular deitado): o topo da Semana não fica todo fixo, só a faixa de dias (plan P19). */
export const SHORT_QUERY = "(max-height: 499px)";

function mediaQuery(query: string): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
}

/** true quando a media query casa. Sem matchMedia (jsdom nos testes) é false (plan P3). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = mediaQuery(query);
    list?.addEventListener("change", onChange);
    return () => list?.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => mediaQuery(query)?.matches ?? false, () => false);
}

/** true no layout de celular. */
export function useMobileLayout(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
