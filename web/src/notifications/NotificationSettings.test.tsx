import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationSettings } from "./NotificationSettings";
import { disableOnLogout, syncSubscription } from "./push";

type Call = { key: string; body: unknown };

const SETTINGS = { available: true, publicKey: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4", reminderTime: "20:00", daily: true, atRisk: true, summary: true };
const ENDPOINT = "https://fcm.googleapis.com/fcm/send/aparelho";

/** API simulada: GET /api/notifications responde `settings`; o resto responde 204. */
function mockApi(settings: object = SETTINGS) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    calls.push({ key, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (key === "GET /api/notifications") {
      return new Response(JSON.stringify(settings), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(null, { status: 204 });
  }));
  return calls;
}

/** Navegador com push: permissão, service worker e inscrição simulados. */
function mockPush({ permission = "default" as NotificationPermission, subscribed = false, answer = "granted" as NotificationPermission } = {}) {
  const subscription = {
    endpoint: ENDPOINT,
    options: { applicationServerKey: null },
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: "chave-p256dh", auth: "segredo" } }),
    unsubscribe: vi.fn(async () => {
      current = null;
      return true;
    }),
  };
  let current: typeof subscription | null = subscribed ? subscription : null;
  const pushManager = {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async () => (current = subscription)),
  };
  const registration = { pushManager };
  const notification = {
    permission,
    requestPermission: vi.fn(async () => {
      notification.permission = answer;
      return answer;
    }),
  };
  vi.stubGlobal("Notification", notification);
  vi.stubGlobal("PushManager", function PushManager() {});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn(async () => registration),
      register: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
  return { subscription, pushManager, notification };
}

beforeEach(() => {
  document.cookie = "XSRF-TOKEN=token-de-teste";
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // @ts-expect-error: remove o service worker simulado
  delete navigator.serviceWorker;
});

describe("card de notificações na tela da conta (spec 011, US1)", () => {
  it("sem suporte a push no navegador: indisponíveis", async () => {
    mockApi();
    render(<NotificationSettings userId={1} />);
    expect(await screen.findByText("As notificações não estão disponíveis neste aparelho ou navegador.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ativar/i })).not.toBeInTheDocument();
  });

  it("sem as chaves no servidor: indisponíveis", async () => {
    mockApi({ ...SETTINGS, available: false, publicKey: null });
    mockPush();
    render(<NotificationSettings userId={1} />);
    expect(await screen.findByText("Indisponíveis")).toBeInTheDocument();
  });

  it("iPhone fora da tela de início: passos para instalar, sem o botão de ativar", async () => {
    mockApi();
    const original = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" });
    try {
      render(<NotificationSettings userId={1} />);
      expect(await screen.findByText("Adicione o Habits à tela de início")).toBeInTheDocument();
      expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ativar/i })).not.toBeInTheDocument();
    } finally {
      // @ts-expect-error: volta ao userAgent do jsdom
      delete navigator.userAgent;
      if (original) Object.defineProperty(Navigator.prototype, "userAgent", original);
    }
  });

  it("permissão negada no aparelho: bloqueadas, com como liberar", async () => {
    mockApi();
    mockPush({ permission: "denied" });
    render(<NotificationSettings userId={1} />);
    expect(await screen.findByText("Bloqueadas neste aparelho")).toBeInTheDocument();
    expect(screen.getByText(/ajustes do navegador/)).toBeInTheDocument();
  });

  it("ativar pede a permissão, inscreve e entrega o aparelho à API", async () => {
    const calls = mockApi();
    const { pushManager, notification } = mockPush();
    render(<NotificationSettings userId={7} />);

    await userEvent.click(await screen.findByRole("button", { name: "Ativar neste aparelho" }));

    expect(await screen.findByText("Ativas neste aparelho")).toBeInTheDocument();
    expect(notification.requestPermission).toHaveBeenCalled();
    expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(calls).toContainEqual({ key: "PUT /api/notifications/devices",
      body: { endpoint: ENDPOINT, keys: { p256dh: "chave-p256dh", auth: "segredo" } } });
    expect(screen.getByLabelText("Horário do lembrete")).toHaveValue("20:00");
    expect(screen.getByRole("checkbox", { name: /Lembrete diário/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Meta em risco/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Resumo da semana/ })).toBeChecked();
    expect(localStorage.getItem("habits:push-user")).toBe("7");
  });

  it("recusar a permissão no pedido: bloqueadas, sem inscrever", async () => {
    const calls = mockApi();
    const { pushManager } = mockPush({ answer: "denied" });
    render(<NotificationSettings userId={1} />);

    await userEvent.click(await screen.findByRole("button", { name: "Ativar neste aparelho" }));

    expect(await screen.findByText("Bloqueadas neste aparelho")).toBeInTheDocument();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(calls.map((c) => c.key)).not.toContain("PUT /api/notifications/devices");
  });

  it("salvar horário e tipos", async () => {
    const calls = mockApi();
    mockPush({ permission: "granted", subscribed: true });
    render(<NotificationSettings userId={1} />);

    const time = await screen.findByLabelText("Horário do lembrete");
    const save = screen.getByRole("button", { name: "Salvar preferências" });
    expect(save).toBeDisabled();
    await userEvent.clear(time);
    await userEvent.type(time, "21:30");
    await userEvent.click(screen.getByRole("checkbox", { name: /Resumo da semana/ }));
    await userEvent.click(save);

    expect(await screen.findByText("Preferências salvas.")).toBeInTheDocument();
    expect(calls).toContainEqual({ key: "PUT /api/notifications/settings",
      body: { reminderTime: "21:30", daily: true, atRisk: true, summary: false } });
  });

  it("desativar tira o aparelho da API e cancela a inscrição", async () => {
    const calls = mockApi();
    const { subscription } = mockPush({ permission: "granted", subscribed: true });
    render(<NotificationSettings userId={1} />);

    await userEvent.click(await screen.findByRole("button", { name: "Desativar neste aparelho" }));

    expect(await screen.findByText("Desativadas neste aparelho")).toBeInTheDocument();
    expect(calls).toContainEqual({ key: "DELETE /api/notifications/devices", body: { endpoint: ENDPOINT } });
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});

describe("inscrição do aparelho ao sair e ao abrir o app (spec 011, RF-012)", () => {
  it("sair remove o aparelho da API e cancela a inscrição", async () => {
    const calls = mockApi();
    const { subscription } = mockPush({ permission: "granted", subscribed: true });

    await disableOnLogout();

    expect(calls).toContainEqual({ key: "DELETE /api/notifications/devices", body: { endpoint: ENDPOINT } });
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it("sair sem notificações ativas não chama a API", async () => {
    const calls = mockApi();
    mockPush();
    await disableOnLogout();
    expect(calls).toEqual([]);
  });

  it("ao abrir, reentrega a inscrição de quem ativou; de outra conta, cancela", async () => {
    const calls = mockApi();
    const { subscription } = mockPush({ permission: "granted", subscribed: true });
    localStorage.setItem("habits:push-user", "7");

    await syncSubscription(7);
    expect(calls.map((c) => c.key)).toEqual(["PUT /api/notifications/devices"]);

    await syncSubscription(8);
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });
});
