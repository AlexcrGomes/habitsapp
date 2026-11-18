import { useEffect } from "react";

/**
 * Motivos que impedem recarregar o app para a versão nova (spec 011, plan P17): diálogo aberto,
 * campos de entrar preenchidos, arraste em andamento, requisição que altera dados em andamento.
 * Enquanto houver algum, nada recarrega sozinho e "Atualizar" fica pendente (RF-016, RF-018).
 */
const active = new Set<symbol>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Registra um motivo; devolve a função que o libera (pode ser chamada mais de uma vez). */
export function block(): () => void {
  const reason = Symbol("bloqueio");
  active.add(reason);
  notify();
  return () => {
    if (active.delete(reason)) notify();
  };
}

export function isBlocked(): boolean {
  return active.size > 0;
}

/** Avisado a cada mudança nos bloqueios; devolve a função que cancela. */
export function subscribeBlockers(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Bloqueia a atualização enquanto `when` for verdadeiro. */
export function useUpdateBlocker(when: boolean) {
  useEffect(() => {
    if (!when) return;
    return block();
  }, [when]);
}

/** Só para testes: zera os bloqueios entre um caso e outro. */
export function resetBlockers() {
  active.clear();
  notify();
}
