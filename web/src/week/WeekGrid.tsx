import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";
import { formatDay, isEditable, lockReason, weekdayShort } from "./dates";

interface WeekGridProps {
  days: string[];
  today: string;
  habits: Habit[];
  checks: Set<string>;
  onToggle: (habitId: number, day: string, checked: boolean) => void;
}

/** Só os dias rolam na horizontal: nomes dos hábitos e cabeçalho continuam visíveis. */
export function WeekGrid({ days, today, habits, checks, onToggle }: WeekGridProps) {
  return (
    <div className="days">
      {days.map((day) => (
        <div key={day} className={day === today ? "day today" : "day"} aria-current={day === today ? "date" : undefined}>
          <div className="day-label">
            <span className="day-weekday">{weekdayShort(day)}</span>
            <span>{formatDay(day)}</span>
          </div>
          {habits.map((habit) => (
            <input
              key={habit.id}
              type="checkbox"
              aria-label={`${habit.name} em ${formatDay(day)}${lockReason(day, today)}`}
              checked={checks.has(checkKey(habit.id, day))}
              disabled={!isEditable(day, today)}
              onChange={(event) => onToggle(habit.id, day, event.target.checked)}
            />
          ))}
        </div>
      ))}
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
