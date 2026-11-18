import { ApiError, api } from "../api/client";

/**
 * Notificações push no navegador (spec 011, plan P3/P4): service worker, permissão e inscrição.
 * A ativação vale por aparelho: a inscrição deste navegador é entregue à API.
 */

/** "supported": pode ativar; "ios-install": iPhone/iPad fora do app da tela inicial; "unsupported": sem push. */
export type PushSupport = "supported" | "ios-install" | "unsupported";

function isIos(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;
  // iPadOS se apresenta como Mac; o toque denuncia
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function pushSupport(): PushSupport {
  if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) return "supported";
  // No iPhone, o push só existe no app aberto pela tela inicial (iOS 16.4+)
  return isIos() ? "ios-install" : "unsupported";
}

export function permission(): NotificationPermission {
  return "Notification" in window ? Notification.permission : "default";
}

/** Registra o service worker ao abrir o app; falha sem quebrar nada. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "supported") return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ? existing.pushManager.getSubscription() : null;
}

function toDevice(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return { endpoint: subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } };
}

export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Ativa neste aparelho: pede a permissão, inscreve e entrega à API.
 * Devolve a permissão final ("granted" = ativado).
 */
export async function enable(publicKey: string, userId: number): Promise<NotificationPermission> {
  const result = await Notification.requestPermission();
  if (result !== "granted") return result;
  const reg = await registration();
  const key = base64UrlToBytes(publicKey);
  let subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    // Inscrição feita com outra chave do servidor não serve: refaz
    const current = subscription.options.applicationServerKey;
    const same = current && new Uint8Array(current).every((byte, i) => byte === key[i]);
    if (!same) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  subscription ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await api.notifications.addDevice(toDevice(subscription));
  rememberOwner(userId);
  return result;
}

/** Desativa neste aparelho: tira da API e cancela a inscrição no navegador. */
export async function disable(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  try {
    await api.notifications.removeDevice(subscription.endpoint);
  } catch (e) {
    // Já não estava na API (ex.: outra conta): basta cancelar aqui
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  await subscription.unsubscribe();
  rememberOwner(null);
}

/**
 * Ao sair (RF-012): cancela a inscrição deste aparelho. Erros de rede não impedem a saída: sem a
 * inscrição no navegador, o serviço de push deixa de entregar e a API a apaga no próximo envio.
 */
export async function disableOnLogout(): Promise<void> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    await api.notifications.removeDevice(subscription.endpoint).catch(() => undefined);
    await subscription.unsubscribe().catch(() => false);
    rememberOwner(null);
  } catch {
    // sem suporte ou sem service worker: nada a fazer
  }
}

/**
 * Ao abrir o app logado: reentrega a inscrição existente (renovação; plan P4). Se ela foi ativada
 * por outra conta (ex.: a sessão expirou e outra pessoa entrou), é cancelada: o aparelho só recebe
 * da conta que ativou nele depois de entrar (spec 011, casos de borda).
 */
export async function syncSubscription(userId: number): Promise<void> {
  try {
    if (permission() !== "granted") return;
    const subscription = await currentSubscription();
    if (!subscription) return;
    const activatedBy = owner();
    if (activatedBy !== undefined && activatedBy !== userId) {
      await subscription.unsubscribe();
      rememberOwner(null);
      return;
    }
    await api.notifications.addDevice(toDevice(subscription));
  } catch {
    // Sem chaves no servidor ou sem rede: a tela da conta mostra o estado real
  }
}

const OWNER_KEY = "habits:push-user";

/** Conta que ativou neste aparelho; undefined quando o navegador não deixa ler (aí não se cancela nada). */
function owner(): number | null | undefined {
  try {
    const value = localStorage.getItem(OWNER_KEY);
    return value === null ? null : Number(value);
  } catch {
    return undefined;
  }
}

function rememberOwner(userId: number | null) {
  try {
    if (userId === null) localStorage.removeItem(OWNER_KEY);
    else localStorage.setItem(OWNER_KEY, String(userId));
  } catch {
    // sem localStorage: a inscrição continua valendo para quem ativou
  }
}
