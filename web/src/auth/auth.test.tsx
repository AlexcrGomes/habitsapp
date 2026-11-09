import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";

type Reply = { status: number; body?: unknown };

/** Simula a API: cada chamada consome a próxima resposta da rota. */
function mockApi(routes: Record<string, Reply[]>) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    calls.push(key);
    const reply = routes[key]?.shift() ?? { status: 404, body: { code: "NOT_FOUND", message: "Não encontrado." } };
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { "Content-Type": "application/json" },
    });
  }));
  return calls;
}

const unauthenticated: Reply = { status: 401, body: { code: "UNAUTHENTICATED", message: "Faça login para continuar." } };

describe("login e cadastro", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=token-de-teste";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sem sessão mostra o login, e falha de login mostra a mensagem genérica", async () => {
    mockApi({
      "GET /api/auth/me": [unauthenticated],
      "POST /api/auth/login": [{ status: 401, body: { code: "BAD_CREDENTIALS", message: "E-mail ou senha inválidos." } }],
    });
    render(<App />);

    await userEvent.type(await screen.findByLabelText("E-mail"), "ana@teste.com");
    await userEvent.type(screen.getByLabelText("Senha"), "errada123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    // Falha de login não é tratada como sessão expirada
    expect(screen.queryByText("Sua sessão expirou. Entre novamente.")).not.toBeInTheDocument();
  });

  it("envia o token CSRF do cookie no header", async () => {
    mockApi({
      "GET /api/auth/me": [unauthenticated],
      "POST /api/auth/login": [{ status: 401, body: { code: "BAD_CREDENTIALS", message: "E-mail ou senha inválidos." } }],
    });
    render(<App />);

    await userEvent.type(await screen.findByLabelText("E-mail"), "ana@teste.com");
    await userEvent.type(screen.getByLabelText("Senha"), "qualquer-coisa");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await screen.findByRole("alert");

    const loginCall = vi.mocked(fetch).mock.calls.find(([url]) => url === "/api/auth/login");
    expect((loginCall?.[1]?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("token-de-teste");
  });

  it("cadastro valida a senha antes de chamar a API", async () => {
    const calls = mockApi({ "GET /api/auth/me": [unauthenticated] });
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
    await userEvent.type(screen.getByLabelText("Nome"), "Ana");
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@teste.com");
    await userEvent.type(screen.getByLabelText(/^Senha/), "curta");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByText("A senha deve ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(calls).not.toContain("POST /api/auth/register");
  });

  it("mostra os erros de campo devolvidos pela API", async () => {
    mockApi({
      "GET /api/auth/me": [unauthenticated],
      "POST /api/auth/register": [{
        status: 409,
        body: { code: "EMAIL_TAKEN", message: "Este e-mail já está cadastrado." },
      }],
    });
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: "Criar conta" }));
    await userEvent.type(screen.getByLabelText("Nome"), "Ana");
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@teste.com");
    await userEvent.type(screen.getByLabelText(/^Senha/), "senha-segura");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este e-mail já está cadastrado.");
  });

  it("sessão válida abre a tela principal com o nome do usuário", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/auth/me") return Response.json({ id: 1, name: "Ana", email: "ana@teste.com", weekMode: "rolling" });
      if (url === "/api/habits") return Response.json([]);
      if (method === "GET" && url.startsWith("/api/checks")) return Response.json([]);
      return new Response(null, { status: 404 });
    }));
    render(<App />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(await screen.findByText("Crie seu primeiro hábito")).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("login a partir de um favorito de /arquivados abre os Arquivados", async () => {
    window.history.replaceState(null, "", "/arquivados");
    mockApi({
      "GET /api/auth/me": [unauthenticated],
      "POST /api/auth/login": [{ status: 200, body: { id: 1, name: "Ana", email: "ana@teste.com", weekMode: "rolling" } }],
      "GET /api/habits": [{ status: 200, body: [] }],
    });
    render(<App />);

    await userEvent.type(await screen.findByLabelText("E-mail"), "ana@teste.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha-segura");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Hábitos arquivados" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/arquivados");
  });
});
