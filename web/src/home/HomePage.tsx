import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Habit, User, WeekMode } from "../api/types";
import { ChangePasswordDialog } from "../auth/ChangePasswordDialog";
import { useAuth } from "../auth/AuthContext";
import { WeekSummary } from "../goals/WeekSummary";
import { ArchivedDialog } from "../habits/ArchivedDialog";
import { HabitDialog } from "../habits/HabitDialog";
import { HabitList } from "../habits/HabitList";
import { MAX_ACTIVE } from "../habits/rules";
import { useHabits } from "../habits/useHabits";
import { periodLabel, todayKey, visibleDays } from "../week/dates";
import { WeekGrid, scrollToToday } from "../week/WeekGrid";
import { WeekNav } from "../week/WeekNav";
import { UserMenu } from "./UserMenu";

type Dialog = { type: "habit"; habit: Habit | null } | { type: "archived" } | { type: "password" } | null;

export function HomePage({ user }: { user: User }) {
  const { updateUser, logout } = useAuth();
  const [today, setToday] = useState(todayKey);
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<string | null>(null);
  const todayRef = useRef(today);

  const days = useMemo(() => visibleDays(user.weekMode, offset, today), [user.weekMode, offset, today]);
  const { habits, checks, goals, loaded, error, setError, toggle, move, mutate } = useHabits(days[0], days[6]);
  const active = habits.filter((habit) => !habit.archived);
  const archived = habits.filter((habit) => habit.archived);

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

  // Celular: a grade abre rolada até hoje
  useEffect(() => {
    if (offset === 0 && loaded) scrollToToday();
  }, [offset, loaded, user.weekMode, today]);

  async function changeMode(mode: WeekMode) {
    try {
      updateUser(await api.updateSettings(mode));
      setOffset(0);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setMessage(e instanceof ApiError ? e.message : "Erro inesperado.");
    }
  }

  const notice = message ?? error;
  const closeDialog = () => setDialog(null);

  return (
    <>
      <header>
        <img src="/logo.svg" alt="Logomarca do aplicativo habits" />
        <WeekNav
          period={periodLabel(days)}
          offset={offset}
          mode={user.weekMode}
          onPrevious={() => setOffset((value) => value - 1)}
          onNext={() => setOffset((value) => Math.min(0, value + 1))}
          onModeChange={changeMode}
        />
        <UserMenu name={user.name} email={user.email}
          onChangePassword={() => setDialog({ type: "password" })} onLogout={logout} />
      </header>

      {notice && (
        <p className="app-message" role="status">
          {notice}
          <button type="button" aria-label="Fechar aviso" onClick={() => { setMessage(null); setError(null); }}>×</button>
        </p>
      )}

      {loaded && <WeekSummary habits={active} checks={checks} goals={goals} days={days} today={today} />}

      <main className="board">
        {loaded ? (
          <>
            <HabitList
              habits={active}
              days={days}
              checks={checks}
              goals={goals}
              archivedCount={archived.length}
              onNew={() => setDialog({ type: "habit", habit: null })}
              onEdit={(habit) => setDialog({ type: "habit", habit })}
              onOpenArchived={() => setDialog({ type: "archived" })}
              onMove={move}
            />
            <WeekGrid days={days} today={today} habits={active} checks={checks} onToggle={toggle} />
          </>
        ) : (
          <p className="loading" role="status">Carregando…</p>
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

      <ArchivedDialog
        open={dialog?.type === "archived"}
        habits={archived}
        limitReached={active.length >= MAX_ACTIVE}
        onClose={closeDialog}
        onRestore={(habit) => mutate(() => api.habits.restore(habit.id))}
        onDelete={(habit) => mutate(() => api.habits.remove(habit.id))}
      />

      <ChangePasswordDialog
        open={dialog?.type === "password"}
        onClose={closeDialog}
        onChanged={() => {
          closeDialog();
          setMessage("Senha alterada.");
        }}
      />
    </>
  );
}
