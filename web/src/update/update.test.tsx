import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { block, isBlocked, resetBlockers } from "./blockers";
import { NOTES_SEEN_KEY, NotesDialog, shouldShowNotes } from "./NotesDialog";
import { AWAY_LIMIT_MS, CHECK_INTERVAL_MS, UpdateProvider } from "./UpdateProvider";
import { UpdateBanner } from "./UpdateBanner";
import { CURRENT, page } from "./version";

type Status = "loading" | "anonymous" | "authenticated";

/** Servidor simulado: versão publicada e situação da API (200/401 no ar; 502 fora). */
const server = { version: CURRENT.version, notes: "", notesId: "", api: 200 };

function mockServer() {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url === "/version.json") {
      return new Response(JSON.stringify({ version: server.version, notes: server.notes, notesId: server.notesId }), { status: 200 });
    }
    if (url === "/api/auth/me") return new Response("{}", { status: server.api });
    return new Response(null, { status: 204 });
  }));
}

function publish(notes = "", notesId = "") {
  server.version = "nova-versao";
  server.notes = notes;
  server.notesId = notesId;
}

let visibility: DocumentVisibilityState = "visible";
function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

function renderApp(status: Status = "authenticated") {
  const view = render(<UpdateProvider status={status}><UpdateBanner /></UpdateProvider>);
  return { rerender: (next: Status) => view.rerender(<UpdateProvider status={next}><UpdateBanner /></UpdateProvider>) };
}

/** Deixa as promessas (fetch) terminarem. */
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

let reload: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(server, { version: CURRENT.version, notes: "", notesId: "", api: 200 });
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  mockServer();
  reload = vi.spyOn(page, "reload").mockImplementation(() => undefined);
  sessionStorage.clear();
  localStorage.clear();
  resetBlockers();
});

afterEach(() => {
  // Desmonta antes de restaurar o reload: um Atualizar pendente não pode navegar de verdade no jsdom
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetBlockers();
});

describe("aviso de versão nova durante o uso (spec 011, US3)", () => {
  it("aparece em até 5 minutos depois da publicação, sem recarregar sozinho", async () => {
    renderApp();
    await settle();
    expect(screen.queryByText("Nova versão disponível")).not.toBeInTheDocument();

    publish();
    await advance(CHECK_INTERVAL_MS);

    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
    expect(CHECK_INTERVAL_MS).toBeLessThan(5 * 60_000);
  });

  it("não anuncia enquanto a API não estiver no ar (deploy em andamento)", async () => {
    renderApp();
    await settle();
    publish();
    server.api = 502;
    await advance(CHECK_INTERVAL_MS);
    expect(screen.queryByText("Nova versão disponível")).not.toBeInTheDocument();

    server.api = 401;
    await advance(CHECK_INTERVAL_MS);
    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
  });

  it("mostra o resumo só quando as novidades mudaram", async () => {
    renderApp();
    await settle();
    publish("Notificações chegaram.", "novas-notas");
    await advance(CHECK_INTERVAL_MS);
    expect(screen.getByText("Notificações chegaram.")).toBeInTheDocument();
  });

  it("sem novidades novas, o aviso fica só com o título", async () => {
    renderApp();
    await settle();
    publish(CURRENT.notes || "Texto antigo", CURRENT.notesId);
    await advance(CHECK_INTERVAL_MS);
    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
    expect(screen.queryByText("Texto antigo")).not.toBeInTheDocument();
  });

  it("não confere com a aba oculta", async () => {
    renderApp();
    await settle();
    visibility = "hidden";
    publish();
    await advance(CHECK_INTERVAL_MS * 2);
    expect(screen.queryByText("Nova versão disponível")).not.toBeInTheDocument();
  });

  it("Atualizar sem bloqueio recarrega na hora", async () => {
    renderApp();
    await settle();
    publish();
    await advance(CHECK_INTERVAL_MS);

    act(() => screen.getByRole("button", { name: "Atualizar" }).click());

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("com um diálogo aberto, Atualizar espera ele fechar", async () => {
    renderApp();
    await settle();
    publish();
    await advance(CHECK_INTERVAL_MS);
    let release = () => {};
    act(() => {
      release = block();
    });

    act(() => screen.getByRole("button", { name: "Atualizar" }).click());

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Atualizando ao fechar o formulário…" })).toBeDisabled();
    act(() => release());
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("uma alteração em andamento (ex.: marcação) bloqueia a atualização até terminar", async () => {
    let finish: (response: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => {
      finish = resolve;
    })));

    const marking = api.checks.mark(1, "2026-11-18");
    expect(isBlocked()).toBe(true);
    finish(new Response(null, { status: 204 }));
    await marking;
    expect(isBlocked()).toBe(false);
  });
});

describe("versão nova automática ao abrir ou entrar (spec 011, US4)", () => {
  it("ao abrir com uma versão nova no servidor, recarrega sozinho uma única vez", async () => {
    publish();
    renderApp();
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    // Se o servidor ainda entregar a antiga, não entra em laço: mostra o aviso
    renderApp();
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
  });

  it("na tela Entrar sem nada digitado, recarrega sozinho", async () => {
    renderApp("anonymous");
    await settle();
    publish();
    await advance(CHECK_INTERVAL_MS);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("na tela Entrar com algo digitado, espera; ao entrar, recarrega", async () => {
    const view = renderApp("anonymous");
    await settle();
    const release = block();
    publish();
    await advance(CHECK_INTERVAL_MS);
    expect(reload).not.toHaveBeenCalled();

    release(); // a tela de login sai ao entrar
    view.rerender("authenticated");
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("logo depois de entrar, sem versão nova, não recarrega", async () => {
    const view = renderApp("anonymous");
    await settle();
    view.rerender("authenticated");
    await settle();
    expect(reload).not.toHaveBeenCalled();
  });

  it("voltar depois de menos de 30 minutos mostra o aviso", async () => {
    renderApp();
    await settle();
    setVisibility("hidden");
    publish();
    await advance(AWAY_LIMIT_MS - 60_000);
    act(() => setVisibility("visible"));
    await settle();

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
  });

  it("voltar depois de 30 minutos ou mais recarrega sozinho", async () => {
    renderApp();
    await settle();
    setVisibility("hidden");
    publish();
    await advance(AWAY_LIMIT_MS);
    act(() => setVisibility("visible"));
    await settle();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("voltar depois de 30 minutos com um diálogo aberto mostra o aviso", async () => {
    renderApp();
    await settle();
    block();
    setVisibility("hidden");
    publish();
    await advance(AWAY_LIMIT_MS);
    act(() => setVisibility("visible"));
    await settle();

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
  });
});

describe("novidades da versão (spec 011, US7)", () => {
  const version = { version: "v2", notes: "Lembretes chegaram.", notesId: "abc" };

  it("primeiro uso só guarda, sem mostrar", () => {
    expect(shouldShowNotes(version)).toBe(false);
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBe("abc");
  });

  it("depois de atualizar com novidades novas, mostra uma vez e guarda ao fechar", () => {
    vi.useRealTimers();
    localStorage.setItem(NOTES_SEEN_KEY, "antigas");
    const first = render(<NotesDialog version={version} />);

    expect(screen.getByRole("dialog", { name: "Novidades da versão" })).toBeInTheDocument();
    expect(screen.getByText("Lembretes chegaram.")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Fechar" }).click());
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBe("abc");
    first.unmount();

    render(<NotesDialog version={version} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("versão sem novidades não mostra nada", () => {
    localStorage.setItem(NOTES_SEEN_KEY, "antigas");
    expect(shouldShowNotes({ version: "v3", notes: "", notesId: "" })).toBe(false);
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBe("antigas");
  });

  it("sem localStorage não quebra nem mostra", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(shouldShowNotes(version)).toBe(false);
  });
});
