import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Goal, Habit } from "../api/types";
import type { Goals } from "../goals/progress";
import { checkKey } from "./rules";

function toggled(set: Set<string>, key: string, checked: boolean): Set<string> {
  const next = new Set(set);
  if (checked) next.add(key);
  else next.delete(key);
  return next;
}

function toGoals(list: Goal[]): Goals {
  return new Map(list.map((goal) => [goal.habitId, goal.daysPerWeek]));
}

/** Hábitos do usuário, marcações do período visível e metas vigentes no último dia dele. */
export function useHabits(from: string, to: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checks, setChecks] = useState<Set<string>>(() => new Set());
  const [goals, setGoals] = useState<Goals>(() => new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = useCallback((e: unknown) => {
    // 401 é tratado pelo AuthContext (volta ao login com aviso)
    if (e instanceof ApiError && e.status === 401) return;
    setError(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.");
  }, []);

  const reload = useCallback(async () => {
    setHabits(await api.habits.list());
  }, []);

  const reloadGoals = useCallback(async () => {
    setGoals(toGoals(await api.goals.list(to)));
  }, [to]);

  useEffect(() => {
    let cancelled = false;
    api.goals.list(to).then((list) => {
      if (!cancelled) setGoals(toGoals(list));
    }, fail);
    return () => {
      cancelled = true;
    };
  }, [to, fail]);

  useEffect(() => {
    reload().then(() => setLoaded(true), fail);
  }, [reload, fail]);

  useEffect(() => {
    let cancelled = false;
    api.checks.list(from, to).then((list) => {
      if (!cancelled) setChecks(new Set(list.map((check) => checkKey(check.habitId, check.day))));
    }, fail);
    return () => {
      cancelled = true;
    };
  }, [from, to, fail]);

  /** Otimista: a marcação aparece na hora e volta atrás se a API recusar. */
  const toggle = useCallback(async (habitId: number, day: string, checked: boolean) => {
    const key = checkKey(habitId, day);
    setChecks((current) => toggled(current, key, checked));
    try {
      if (checked) await api.checks.mark(habitId, day);
      else await api.checks.unmark(habitId, day);
    } catch (e) {
      setChecks((current) => toggled(current, key, !checked));
      fail(e);
    }
  }, [fail]);

  /** toIndex é a posição entre os hábitos ativos. */
  const move = useCallback(async (id: number, toIndex: number) => {
    const active = habits.filter((habit) => !habit.archived);
    const fromIndex = active.findIndex((habit) => habit.id === id);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= active.length || toIndex === fromIndex) return;

    const reordered = [...active];
    const [habit] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, habit);
    setHabits([...reordered, ...habits.filter((item) => item.archived)]);

    try {
      setHabits(await api.habits.reorder(reordered.map((item) => item.id)));
    } catch (e) {
      fail(e);
      await reload().catch(() => undefined);
    }
  }, [habits, fail, reload]);

  /** Executa uma ação de hábito e recarrega a lista. Erros sobem para o diálogo mostrar. */
  const mutate = useCallback(async (action: () => Promise<unknown>) => {
    await action();
    await Promise.all([reload(), reloadGoals()]);
  }, [reload, reloadGoals]);

  return { habits, checks, goals, loaded, error, setError, toggle, move, mutate };
}
