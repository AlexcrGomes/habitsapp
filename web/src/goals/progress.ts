import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";

/** Cálculo das metas semanais (spec 006), feito sobre as marcações já carregadas da semana exibida. */

export const MIN_GOAL = 1;
export const MAX_GOAL = 7;

/** habitId → meta vigente na semana exibida (só hábitos com meta). */
export type Goals = Map<number, number>;

export interface WeekSummaryData {
  percent: number;
  label: string;
}

export function doneCount(habitId: number, days: string[], checks: Set<string>): number {
  return days.filter((day) => checks.has(checkKey(habitId, day))).length;
}

/** Fração da meta cumprida, de 0 a 1; marcar além da meta não dá bônus. */
export function habitProgress(done: number, goal: number): number {
  return Math.min(done, goal) / goal;
}

export function summaryLabel(percent: number): string {
  if (percent >= 100) return "Semana perfeita";
  if (percent >= 70) return "Boa semana";
  if (percent >= 40) return "Dá para melhorar";
  return "Semana fraca";
}

/**
 * Soma do que foi cumprido (cada meta limitada ao próprio tamanho) ÷ soma das metas.
 * null quando nenhum dos hábitos tem meta na semana.
 */
export function weekSummary(habits: Habit[], checks: Set<string>, goals: Goals, days: string[]): WeekSummaryData | null {
  let achieved = 0;
  let total = 0;
  for (const habit of habits) {
    const goal = goals.get(habit.id);
    if (!goal) continue;
    achieved += Math.min(doneCount(habit.id, days, checks), goal);
    total += goal;
  }
  if (total === 0) return null;

  // 100% só quando todas as metas foram cumpridas de fato (99,6% não arredonda para "perfeita")
  const percent = achieved === total ? 100 : Math.min(99, Math.round((100 * achieved) / total));
  return { percent, label: summaryLabel(percent) };
}
