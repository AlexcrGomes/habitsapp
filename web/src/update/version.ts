/** Versão do web em execução e a publicada no servidor (spec 011, plan P14/P15). */

export interface AppVersion {
  version: string;
  /** Resumo de novidades ("" = sem resumo) */
  notes: string;
  notesId: string;
}

export const CURRENT: AppVersion = { version: __APP_VERSION__, notes: __APP_NOTES__, notesId: __APP_NOTES_ID__ };

/**
 * Versão publicada diferente da que está rodando, com a API no ar (plan P15); senão null.
 * Durante o deploy o web novo pode subir antes da API: recarregar nessa hora mostraria erro.
 */
export async function fetchNewVersion(): Promise<AppVersion | null> {
  try {
    const response = await fetch("/version.json", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<AppVersion>;
    if (typeof data.version !== "string" || data.version === CURRENT.version) return null;

    // Direto, sem o cliente da API: um 401 aqui não é "sessão expirada"
    const api = await fetch("/api/auth/me", { credentials: "same-origin", headers: { Accept: "application/json" } });
    if (api.status !== 200 && api.status !== 401) return null;

    return { version: data.version, notes: String(data.notes ?? ""), notesId: String(data.notesId ?? "") };
  } catch {
    return null;
  }
}

/** Recarrega a página (mantém a rota e o cookie de sessão). Isolado para os testes. */
export const page = {
  reload: () => window.location.reload(),
};
