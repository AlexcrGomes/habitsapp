import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Habit } from "../api/types";
import { type Goals, weekSummary } from "./progress";

interface WeekSummaryProps {
  habits: Habit[];
  checks: Set<string>;
  goals: Goals;
  days: string[];
  today: string;
  /** Celular: mesmas informações em menos altura, sem o ícone (spec 010, plan P10). */
  compact?: boolean;
}

/** Resumo geral das metas da semana exibida (spec 006, US3). */
export function WeekSummary({ habits, checks, goals, days, today, compact = false }: WeekSummaryProps) {
  const summary = weekSummary(habits, checks, goals, days);
  const inProgress = days.includes(today);
  const title = (
    <h2 id="week-summary-title" className={compact ? "min-w-0 text-xs font-medium text-slate-500" : "text-sm font-medium text-slate-500"}>
      {inProgress ? "Resumo da semana · Até agora" : "Resumo da semana"}
    </h2>
  );
  const bar = summary && (
    <span aria-hidden="true" className={compact ? "mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100" : "mt-3 block h-2 overflow-hidden rounded-full bg-slate-100"}>
      <span className="block h-full rounded-full bg-linear-to-r from-brand-500 to-brand-700"
        style={{ width: `${summary.percent}%` }} />
    </span>
  );
  const empty = <p className="mt-1 text-sm text-slate-700" role="status">Defina metas nos hábitos para ver o resumo da semana.</p>;

  if (compact) {
    return (
      <Card className="px-4 py-3" aria-labelledby="week-summary-title" role="region">
        {summary ? (
          <>
            {title}
            <div role="status" className="mt-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-brand-700">{summary.label}</span>
                <span className="text-xl leading-tight font-semibold tracking-tight tabular-nums text-ink">{summary.percent}%</span>
              </div>
              {bar}
            </div>
          </>
        ) : (
          <>
            {title}
            {empty}
          </>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5" aria-labelledby="week-summary-title" role="region">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-brand-50/60">
          <Target aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {title}
          {summary ? (
            <div role="status">
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-ink">{summary.percent}%</span>
                <span className="text-sm font-medium text-brand-700">{summary.label}</span>
              </div>
              {bar}
            </div>
          ) : (
            empty
          )}
        </div>
      </div>
    </Card>
  );
}
