import type { Habit } from "../api/types";
import { type Goals, weekSummary } from "./progress";

interface WeekSummaryProps {
  habits: Habit[];
  checks: Set<string>;
  goals: Goals;
  days: string[];
  today: string;
}

/** Resumo geral das metas da semana exibida (spec 006, US3). */
export function WeekSummary({ habits, checks, goals, days, today }: WeekSummaryProps) {
  const summary = weekSummary(habits, checks, goals, days);
  const inProgress = days.includes(today);

  return (
    <section className="week-summary" aria-labelledby="week-summary-title">
      <h2 id="week-summary-title">{inProgress ? "Resumo da semana · Até agora" : "Resumo da semana"}</h2>
      {summary ? (
        <div className="week-summary-body" role="status">
          <span className="week-summary-percent">{summary.percent}%</span>
          <span className="week-summary-label">{summary.label}</span>
        </div>
      ) : (
        <p className="week-summary-empty" role="status">Defina metas nos hábitos para ver o resumo da semana.</p>
      )}
    </section>
  );
}
