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
}

/** Resumo geral das metas da semana exibida (spec 006, US3). */
export function WeekSummary({ habits, checks, goals, days, today }: WeekSummaryProps) {
  const summary = weekSummary(habits, checks, goals, days);
  const inProgress = days.includes(today);

  return (
    <Card className="p-5" aria-labelledby="week-summary-title" role="region">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-brand-50/60">
          <Target aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="week-summary-title" className="text-sm font-medium text-slate-500">
            {inProgress ? "Resumo da semana · Até agora" : "Resumo da semana"}
          </h2>
          {summary ? (
            <div role="status">
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-ink">{summary.percent}%</span>
                <span className="text-sm font-medium text-brand-700">{summary.label}</span>
              </div>
              <span aria-hidden="true" className="mt-3 block h-2 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-linear-to-r from-brand-500 to-brand-700"
                  style={{ width: `${summary.percent}%` }} />
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-700" role="status">Defina metas nos hábitos para ver o resumo da semana.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
