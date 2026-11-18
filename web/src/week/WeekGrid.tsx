import { useState } from "react";
import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";
import { DayCheck } from "./DayCheck";
import { formatDay, weekdayShort } from "./dates";

interface WeekGridProps {
  days: string[];
  today: string;
  habits: Habit[];
  checks: Set<string>;
  onToggle: (habitId: number, day: string, checked: boolean) => void;
}

/**
 * Só os dias rolam na horizontal: nomes dos hábitos e cabeçalho continuam visíveis.
 * Cabeçalho h-14 e linhas h-16, iguais aos da HabitList, para as linhas ficarem alinhadas.
 * As classes .days e .day.today são usadas por scrollToToday (não renomear).
 * Só a caixa que a pessoa acabou de marcar anima o "encaixe" (US5); as que chegam marcadas
 * da API, ao abrir a página ou trocar de semana, aparecem sem animação.
 */
export function WeekGrid({ days, today, habits, checks, onToggle }: WeekGridProps) {
  const [justChecked, setJustChecked] = useState<string | null>(null);
  return (
    <div className="days flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 sm:gap-2">
      {days.map((day) => {
        const isToday = day === today;
        return (
          <div key={day} className={isToday ? "day today flex w-12 shrink-0 flex-col items-center rounded-lg bg-brand-50 sm:w-14" : "day flex w-12 shrink-0 flex-col items-center sm:w-14"}
            aria-current={isToday ? "date" : undefined}>
            {/* Hoje em destaque forte (spec 010, P20): h-11 + my-1.5 = h-14, mantém o alinhamento com a HabitList */}
            <div className={isToday
              ? "my-1.5 flex h-11 w-full flex-col items-center justify-center rounded-md bg-brand-600 leading-tight"
              : "flex h-14 flex-col items-center justify-center leading-tight"}>
              <span className={isToday ? "text-xs font-medium text-white" : "text-xs font-medium text-slate-500"}>
                {weekdayShort(day)}
              </span>
              <span className={isToday ? "text-sm font-semibold tabular-nums text-white" : "text-sm font-semibold tabular-nums text-ink"}>
                {formatDay(day)}
              </span>
            </div>
            {habits.map((habit) => {
              const key = checkKey(habit.id, day);
              const checked = checks.has(key);
              return (
                <div key={habit.id} className="grid h-16 w-full place-items-center border-t border-slate-100">
                  <DayCheck habit={habit} day={day} today={today} checked={checked} animate={justChecked === key}
                    onChange={(value) => {
                      if (value) setJustChecked(key);
                      onToggle(habit.id, day, value);
                    }} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Centraliza a coluna de hoje rolando só a grade de dias na horizontal (nunca a página na vertical). */
export function scrollToToday() {
  const container = document.querySelector<HTMLElement>(".days");
  const today = document.querySelector<HTMLElement>(".day.today");
  if (!container || !today) return;

  const containerRect = container.getBoundingClientRect();
  const todayRect = today.getBoundingClientRect();
  container.scrollLeft += todayRect.left - containerRect.left - (containerRect.width - todayRect.width) / 2;
}
