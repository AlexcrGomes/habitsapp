import { block } from "../update/blockers";
import type { Check, Goal, Habit, NotificationSettings, PushDevice, User } from "./types";

/** Erro da API com código estável e mensagem em pt-BR (contrato em specs/005-contas-e-servidor/plan.md). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly habitId?: number,
  ) {
    super(message);
  }
}

let onUnauthenticated: (() => void) | null = null;

/** Chamado quando uma requisição de usuário logado volta 401 (sessão expirada). */
export function setUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticated = handler;
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = csrfToken();
  if (token && method !== "GET") headers["X-XSRF-TOKEN"] = token;

  try {
    return await fetch(`/api${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Não foi possível falar com o servidor. Verifique sua conexão.");
  }
}

interface RequestOptions {
  /** Não trata 401 como sessão expirada (login, cadastro e verificação inicial). */
  anonymous?: boolean;
}

export async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  // Uma alteração em andamento (ex.: marcação) impede recarregar para a versão nova (spec 011, P17)
  const release = method === "GET" ? null : block();
  try {
    return await perform<T>(method, path, body, options);
  } finally {
    release?.();
  }
}

async function perform<T>(method: string, path: string, body: unknown, options: RequestOptions): Promise<T> {
  let response = await send(method, path, body);

  // Sem cookie XSRF-TOKEN (ex.: apagado): a API recusa com 403. Qualquer GET devolve o cookie; tenta uma vez de novo.
  if (response.status === 403 && method !== "GET") {
    await send("GET", "/auth/me");
    response = await send(method, path, body);
  }

  if (response.status === 401 && !options.anonymous) onUnauthenticated?.();

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      data.code ?? "ERROR",
      data.message ?? "Erro inesperado. Tente novamente.",
      data.fields,
      data.habitId,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  me: () => request<User>("GET", "/auth/me", undefined, { anonymous: true }),
  login: (email: string, password: string) =>
    request<User>("POST", "/auth/login", { email, password }, { anonymous: true }),
  register: (name: string, email: string, password: string) =>
    request<User>("POST", "/auth/register", { name, email, password }, { anonymous: true }),
  logout: () => request<void>("POST", "/auth/logout"),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("PUT", "/me/password", { currentPassword, newPassword }),

  habits: {
    list: () => request<Habit[]>("GET", "/habits"),
    create: (name: string, emoji: string, goal: number | null, objective: string) =>
      request<Habit>("POST", "/habits", { name, emoji, goal, objective }),
    /** Substitui nome, emoji e meta. */
    update: (id: number, name: string, emoji: string, goal: number | null, objective: string) =>
      request<Habit>("PATCH", `/habits/${id}`, { name, emoji, goal, objective }),
    archive: (id: number) => request<Habit>("POST", `/habits/${id}/archive`),
    restore: (id: number) => request<Habit>("POST", `/habits/${id}/restore`),
    remove: (id: number) => request<void>("DELETE", `/habits/${id}`),
    reorder: (ids: number[]) => request<Habit[]>("PUT", "/habits/order", { ids }),
  },

  checks: {
    list: (from: string, to: string) => request<Check[]>("GET", `/checks?from=${from}&to=${to}`),
    mark: (habitId: number, day: string) => request<void>("PUT", `/checks/${habitId}/${day}`),
    unmark: (habitId: number, day: string) => request<void>("DELETE", `/checks/${habitId}/${day}`),
  },

  goals: {
    /** Metas vigentes na data (o último dia da semana exibida). */
    list: (at: string) => request<Goal[]>("GET", `/goals?at=${at}`),
  },

  /** Notificações (spec 011). */
  notifications: {
    get: () => request<NotificationSettings>("GET", "/notifications"),
    save: (settings: Pick<NotificationSettings, "reminderTime" | "daily" | "atRisk" | "summary">) =>
      request<void>("PUT", "/notifications/settings", settings),
    addDevice: (device: PushDevice) => request<void>("PUT", "/notifications/devices", device),
    removeDevice: (endpoint: string) => request<void>("DELETE", "/notifications/devices", { endpoint }),
  },
};
