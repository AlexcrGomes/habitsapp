import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import type { Habit } from "@/api/types";

const habits: Habit[] = [
  { id: 1, name: "Ler", emoji: "📚", archived: false, goal: null },
  { id: 2, name: "Correr", emoji: "🏃", archived: true, goal: null },
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
