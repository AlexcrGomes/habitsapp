import { Bell, BellOff } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ApiError, api } from "@/api/client";
import type { NotificationSettings as Settings } from "@/api/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { useUpdateBlocker } from "@/update/blockers";
import { currentSubscription, disable, enable, permission, pushSupport } from "./push";

type DeviceState = "loading" | "unavailable" | "ios-install" | "blocked" | "off" | "on";

type Prefs = Pick<Settings, "reminderTime" | "daily" | "atRisk" | "summary">;

const TYPES: { key: "daily" | "atRisk" | "summary"; label: string; hint: string }[] = [
  { key: "daily", label: "Lembrete diário", hint: "No horário escolhido, se faltar marcar algum hábito hoje." },
  { key: "atRisk", label: "Meta em risco", hint: "Às 9h, quando a meta da semana só se salva fazendo o hábito hoje." },
  { key: "summary", label: "Resumo da semana", hint: "No domingo, no horário do lembrete." },
];

/** Notificações na tela da conta (spec 011, US1 e RF-006). */
export function NotificationSettings({ userId }: { userId: number }) {
  const [state, setState] = useState<DeviceState>("loading");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "danger" } | null>(null);
  const titleId = useId();

  const dirty = !!settings && !!prefs && (prefs.reminderTime !== settings.reminderTime
    || prefs.daily !== settings.daily || prefs.atRisk !== settings.atRisk || prefs.summary !== settings.summary);
  // Preferências editadas e não salvas não se perdem numa atualização de versão (plan P17)
  useUpdateBlocker(dirty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const support = pushSupport();
      const loaded = await api.notifications.get().catch(() => null);
      if (cancelled) return;
      if (support === "ios-install") return setState("ios-install");
      if (support === "unsupported" || !loaded?.available || !loaded.publicKey) return setState("unavailable");
      setSettings(loaded);
      setPrefs(pick(loaded));
      if (permission() === "denied") return setState("blocked");
      const subscription = await currentSubscription().catch(() => null);
      if (!cancelled) setState(subscription && permission() === "granted" ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    if (!settings?.publicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await enable(settings.publicKey, userId);
      if (result === "granted") {
        setState("on");
        setMessage({ text: "Notificações ativadas neste aparelho.", tone: "success" });
      } else if (result === "denied") {
        setState("blocked");
      }
    } catch (e) {
      setMessage({ text: errorText(e, "Não foi possível ativar as notificações neste aparelho."), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      await disable();
      setState("off");
      setMessage({ text: "Notificações desativadas neste aparelho.", tone: "success" });
    } catch (e) {
      setMessage({ text: errorText(e, "Não foi possível desativar. Tente novamente."), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!prefs || !settings) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.notifications.save(prefs);
      setSettings({ ...settings, ...prefs });
      setMessage({ text: "Preferências salvas.", tone: "success" });
    } catch (e) {
      setMessage({ text: errorText(e, "Não foi possível salvar. Tente novamente."), tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 p-6" role="region" aria-labelledby={titleId}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
          {state === "on" ? <Bell aria-hidden="true" className="size-5" /> : <BellOff aria-hidden="true" className="size-5" />}
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold text-ink">Notificações</h2>
          <p className="text-sm text-slate-500">{STATUS[state]}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4 text-sm text-slate-700">
        {state === "loading" && <Loading className="py-2" />}

        {state === "unavailable" && (
          <p>As notificações não estão disponíveis neste aparelho ou navegador.</p>
        )}

        {state === "ios-install" && (
          <div>
            <p>No iPhone e no iPad, as notificações só funcionam com o Habits na tela de início (iOS 16.4 ou mais recente):</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>No Safari, toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima).</li>
              <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Abra o Habits pelo novo ícone, entre na conta e volte aqui para ativar.</li>
            </ol>
          </div>
        )}

        {state === "blocked" && (
          <p>
            As notificações do Habits estão bloqueadas neste aparelho. Para liberar, permita as notificações
            deste site nos ajustes do navegador (ou do aparelho, no app da tela de início) e volte aqui.
          </p>
        )}

        {state === "off" && (
          <>
            <p>Receba lembretes mesmo com o app fechado. A ativação vale só para este aparelho.</p>
            <Button variant="primary" onClick={turnOn} disabled={busy}>
              <Bell aria-hidden="true" />
              Ativar neste aparelho
            </Button>
          </>
        )}

        {state === "on" && prefs && (
          <form onSubmit={save} className="space-y-4" aria-label="Preferências de notificação">
            <div className="max-w-40">
              <Label htmlFor="reminder-time">Horário do lembrete</Label>
              <Input id="reminder-time" type="time" step={60} required className="mt-1"
                value={prefs.reminderTime}
                onChange={(event) => setPrefs({ ...prefs, reminderTime: event.target.value })} />
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">O que receber</legend>
              {TYPES.map((type) => (
                <label key={type.key} className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-600"
                    checked={prefs[type.key]}
                    onChange={(event) => setPrefs({ ...prefs, [type.key]: event.target.checked })} />
                  <span>
                    <span className="block font-medium text-ink">{type.label}</span>
                    <span className="block text-slate-500">{type.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <p className="text-slate-500">O horário e os tipos valem para todos os seus aparelhos com notificações ativas.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="primary" disabled={busy || !dirty}>Salvar preferências</Button>
              <Button variant="ghost" onClick={turnOff} disabled={busy}>
                <BellOff aria-hidden="true" />
                Desativar neste aparelho
              </Button>
            </div>
          </form>
        )}

        {message && (
          <Alert role="status" variant={message.tone} closeLabel="Fechar aviso" onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </div>
    </Card>
  );
}

const STATUS: Record<DeviceState, string> = {
  loading: "Verificando este aparelho…",
  unavailable: "Indisponíveis",
  "ios-install": "Adicione o Habits à tela de início",
  blocked: "Bloqueadas neste aparelho",
  off: "Desativadas neste aparelho",
  on: "Ativas neste aparelho",
};

function pick(settings: Settings): Prefs {
  return { reminderTime: settings.reminderTime, daily: settings.daily, atRisk: settings.atRisk, summary: settings.summary };
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.fields?.reminderTime ?? error.message;
  return fallback;
}
