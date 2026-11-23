import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import type { Habit } from "@/api/types";
import { formatDay, todayKey } from "@/week/dates";

const habits: Habit[] = [
  { id: 1, name: "Ler", emoji: "📚", archived: false, goal: null, objective: null },
  { id: 2, name: "Correr", emoji: "🏃", archived: true, goal: null, objective: null },
];

/** Sessão válida com um hábito ativo e um arquivado. */
function mockLoggedIn() {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (url === "/api/auth/me") return Response.json({ id: 1, name: "Ana Souza", email: "ana@teste.com", weekMode: "calendar" });
    if (url === "/api/habits") return Response.json(habits);
    if (method === "GET" && (url.startsWith("/api/checks") || url.startsWith("/api/goals"))) return Response.json([]);
    return new Response(null, { status: 404 });
  }));
}

/** Período exibido pela navegação entre semanas (ex.: "26/10 – 01/11"). */
const period = () => screen.getByText(/^\d{2}\/\d{2} – \d{2}\/\d{2}$/).textContent;

describe("estrutura da tela logada", () => {
  beforeEach(mockLoggedIn);
  afterEach(() => vi.unstubAllGlobals());

  it("ir a Arquivados e voltar mantém a semana que estava exibida", async () => {
    render(<App />);
    await screen.findByText("Ler");
    const current = period();

    await userEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
    const previous = period();
    expect(previous).not.toBe(current);

    await userEvent.click(screen.getByRole("link", { name: /^Arquivados/ }));
    expect(await screen.findByRole("heading", { name: "Hábitos arquivados" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/arquivados");
    expect(screen.getByText("Correr")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: "Semana" }));
    expect(await screen.findByRole("heading", { name: "Semana" })).toBeInTheDocument();
    expect(period()).toBe(previous);
  });

  it("o destino atual fica marcado na navegação", async () => {
    window.history.replaceState(null, "", "/arquivados");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Hábitos arquivados" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Arquivados/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Semana" })).not.toHaveAttribute("aria-current");
  });

  it("Novo hábito abre o diálogo em qualquer tela", async () => {
    window.history.replaceState(null, "", "/arquivados");
    render(<App />);
    await screen.findByRole("heading", { name: "Hábitos arquivados" });

    await userEvent.click(screen.getByRole("button", { name: "Novo hábito" }));

    expect(screen.getByRole("heading", { name: "Novo hábito" })).toBeInTheDocument();
  });

  it("endereço desconhecido abre a Semana", async () => {
    window.history.replaceState(null, "", "/xyz");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Semana" })).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });
});

describe("comemoração ao bater a meta (spec 012)", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Um hábito ativo com meta de 1 dia; a marcação responde markStatus. */
  function mockWithGoal(markStatus: number) {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/auth/me") return Response.json({ id: 1, name: "Ana Souza", email: "ana@teste.com", weekMode: "calendar" });
      if (url === "/api/habits") return Response.json([{ ...habits[0], goal: 1, objective: "Ler pelo menos 10 páginas" }]);
      if (url.startsWith("/api/goals")) return Response.json([{ habitId: 1, daysPerWeek: 1 }]);
      if (method === "GET" && url.startsWith("/api/checks")) return Response.json([]);
      if (method === "PUT" && url.startsWith("/api/checks")) return new Response(null, { status: markStatus });
      return new Response(null, { status: 404 });
    }));
  }

  const todayBox = () => screen.getByRole("checkbox", { name: `Ler em ${formatDay(todayKey())}` });

  it("marcar o dia que bate a única meta mostra a semana perfeita; desmarcar não comemora", async () => {
    window.history.replaceState(null, "", "/");
    mockWithGoal(204);
    render(<App />);
    await screen.findByText("Ler");
    expect(screen.getAllByRole("status").some((el) => el.dataset.celebration)).toBe(false);

    await userEvent.click(todayBox());

    const celebration = document.querySelector<HTMLElement>("[data-celebration]")!;
    expect(celebration).toHaveTextContent("Semana perfeita!");
    expect(celebration).toHaveTextContent("Você bateu todas as metas da semana.");
    // O foco continua no campo marcado
    expect(todayBox()).toHaveFocus();
  });

  it("se a API recusar a marcação, a comemoração some", async () => {
    window.history.replaceState(null, "", "/");
    mockWithGoal(500);
    render(<App />);
    await screen.findByText("Ler");

    await userEvent.click(todayBox());

    await waitFor(() => expect(todayBox()).not.toBeChecked());
    expect(document.querySelector("[data-celebration]")).toBeNull();
  });
});
