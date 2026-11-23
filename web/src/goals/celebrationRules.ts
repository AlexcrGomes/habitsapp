import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";
import { type Goals, doneCount, weekSummary } from "./progress";

/** Spec 012: comemoração ao bater a meta do hábito ou ao completar a semana (só visual, nada é gravado). */
export interface CelebrationData {
  kind: "habit" | "week";
  habit: Habit;
  done: number;
  goal: number;
}

/**
 * Decide, com as marcações de ANTES da marcação, se marcar `day` faz o hábito cruzar a meta da
 * semana exibida ou leva o resumo a 100%. Só comemora no momento em que cruza: marcar além da
 * meta, desmarcar, hábito sem meta ou semana já em 100% não comemoram. Cruzar os 100% da semana
 * substitui a comemoração do hábito (US4.2).
 */
export function celebrationFor(
  habits: Habit[],
  checksBefore: Set<string>,
  goals: Goals,
  days: string[],
  habitId: number,
  day: string,
  checked: boolean,
): CelebrationData | null {
  if (!checked) return null;
  const key = checkKey(habitId, day);
  if (checksBefore.has(key)) return null;
  const habit = habits.find((item) => item.id === habitId);
  const goal = goals.get(habitId);
  if (!habit || !goal) return null;

  const checksAfter = new Set(checksBefore).add(key);
  const doneBefore = doneCount(habitId, days, checksBefore);
  const doneAfter = doneCount(habitId, days, checksAfter);
  if (!(doneBefore < goal && doneAfter >= goal)) return null;

  const before = weekSummary(habits, checksBefore, goals, days);
  const after = weekSummary(habits, checksAfter, goals, days);
  const perfect = after?.percent === 100 && (before?.percent ?? 0) < 100;
  return { kind: perfect ? "week" : "habit", habit, done: doneAfter, goal };
}
