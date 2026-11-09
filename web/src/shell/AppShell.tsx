import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "@/api/client";
import type { Habit, User, WeekMode } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { Alert } from "@/components/ui/alert";
import { ChangePasswordDialog } from "@/auth/ChangePasswordDialog";
import { HabitDialog } from "@/habits/HabitDialog";
import { MAX_ACTIVE } from "@/habits/rules";
import { useHabits } from "@/habits/useHabits";
import { AccountPage } from "@/pages/AccountPage";
import { ArchivedPage } from "@/pages/ArchivedPage";
import { WeekPage } from "@/pages/WeekPage";
import { navigate, useRoute } from "@/router";
import { todayKey, visibleDays } from "@/week/dates";
import { AppNav } from "./AppNav";

type Dialog = { type: "habit"; habit: Habit | null } | { type: "password" } | null;

/**
 * Tela logada (spec 009): navegação + rota atual + diálogos. O estado da semana e dos
 * hábitos mora aqui, acima das rotas (plan P9): ir a Arquivados e voltar mantém a semana.
 */
export function AppShell({ user }: { user: User }) {
  const { updateUser, logout } = useAuth();
  const route = useRoute();
  const [today, setToday] = useState(todayKey);
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "danger" } | null>(null);
  const todayRef = useRef(today);

  const days = useMemo(() => visibleDays(user.weekMode, offset, today), [user.weekMode, offset, today]);
  const { habits, checks, goals, loaded, error, setError, toggle, move, mutate } = useHabits(days[0], days[6]);
  const active = habits.filter((habit) => !habit.archived);
  const archived = habits.filter((habit) => habit.archived);
  const limitReached = active.length >= MAX_ACTIVE;

  // App aberto na virada da meia-noite: ao voltar para a aba, mostra o novo dia (spec 004)
  useEffect(() => {
    function refresh() {
      const current = todayKey();
      if (current === todayRef.current) return;
      todayRef.current = current;
      setToday(current);
      setOffset(0);
    }
    const onVisibility = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Endereço desconhecido (ex.: /xyz) vira o da Semana
  useEffect(() => {
    if (window.location.pathname !== route) navigate(route, { replace: true });
  }, [route]);

  // Ao trocar de tela, o foco vai para o título dela (leitor de tela anuncia a tela nova)
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    document.querySelector<HTMLElement>("#conteudo h1")?.focus();
  }, [route]);

  async function changeMode(mode: WeekMode) {
    try {
      updateUser(await api.updateSettings(mode));
      setOffset(0);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setMessage({ text: e instanceof ApiError ? e.message : "Erro inesperado.", tone: "danger" });
    }
  }

  function signOut() {
    logout().finally(() => navigate("/", { replace: true })).catch(() => undefined);
  }

  const notice = message ?? (error ? { text: error, tone: "danger" as const } : null);
  const closeDialog = () => setDialog(null);
  const openPassword = () => setDialog({ type: "password" });

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-700 lg:pb-0 lg:pl-64">
      <AppNav
        name={user.name}
        email={user.email}
        archivedCount={archived.length}
        limitReached={limitReached}
        limit={MAX_ACTIVE}
        onNew={() => setDialog({ type: "habit", habit: null })}
        onChangePassword={openPassword}
        onLogout={signOut}
      />

      <main id="conteudo">
        {notice && (
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-10">
            <Alert role="status" variant={notice.tone} closeLabel="Fechar aviso"
              onClose={() => { setMessage(null); setError(null); }}>
              {notice.text}
            </Alert>
          </div>
        )}

        {route === "/" && (
          <WeekPage
            days={days}
            today={today}
            offset={offset}
            weekMode={user.weekMode}
            habits={active}
            checks={checks}
            goals={goals}
            loaded={loaded}
            onPrevious={() => setOffset((value) => value - 1)}
            onNext={() => setOffset((value) => Math.min(0, value + 1))}
            onModeChange={changeMode}
            onToggle={toggle}
            onMove={move}
            onEdit={(habit) => setDialog({ type: "habit", habit })}
          />
        )}
        {route === "/arquivados" && (
          <ArchivedPage
            habits={archived}
            loaded={loaded}
            limitReached={limitReached}
            onRestore={(habit) => mutate(() => api.habits.restore(habit.id))}
            onDelete={(habit) => mutate(() => api.habits.remove(habit.id))}
          />
        )}
        {route === "/conta" && (
          <AccountPage name={user.name} email={user.email} onChangePassword={openPassword} onLogout={signOut} />
        )}
      </main>

      <HabitDialog
        open={dialog?.type === "habit"}
        habit={dialog?.type === "habit" ? dialog.habit : null}
        onClose={closeDialog}
        onSave={(name, emoji, goal) => {
          const editing = dialog?.type === "habit" ? dialog.habit : null;
          return mutate(() =>
            editing ? api.habits.update(editing.id, name, emoji, goal) : api.habits.create(name, emoji, goal));
        }}
        onRestore={(habitId) => mutate(() => api.habits.restore(habitId))}
        onArchive={(habit) => mutate(() => api.habits.archive(habit.id))}
      />

      <ChangePasswordDialog
        open={dialog?.type === "password"}
        onClose={closeDialog}
        onChanged={() => {
          closeDialog();
          setMessage({ text: "Senha alterada.", tone: "success" });
        }}
      />
    </div>
  );
}
