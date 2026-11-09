import { useEffect } from "react";
import type { Habit, WeekMode } from "@/api/types";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { WeekSummary } from "@/goals/WeekSummary";
import type { Goals } from "@/goals/progress";
import { HabitList } from "@/habits/HabitList";
import { periodLabel } from "@/week/dates";
import { WeekGrid, scrollToToday } from "@/week/WeekGrid";
import { WeekNav } from "@/week/WeekNav";

interface WeekPageProps {
  days: string[];
  today: string;
  /** Semanas atrás da atual (0 = semana atual). */
  offset: number;
  weekMode: WeekMode;
  habits: Habit[];
  checks: Set<string>;
  goals: Goals;
  loaded: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onModeChange: (mode: WeekMode) => void;
  onToggle: (habitId: number, day: string, checked: boolean) => void;
  onMove: (id: number, toIndex: number) => void;
  onEdit: (habit: Habit) => void;
}

/** Tela principal ("/"): semana exibida, resumo, hábitos e grade de dias. */
export function WeekPage(props: WeekPageProps) {
  const { days, today, offset, weekMode, habits, checks, goals, loaded } = props;

  // Celular: a grade abre rolada até hoje (também ao voltar de outra tela)
  useEffect(() => {
    if (offset === 0 && loaded) scrollToToday();
  }, [offset, loaded, weekMode, today]);

  return (
    <>
      {/* Cabeçalho de vidro, fixo a partir de 640 px (no celular rolaria junto para não roubar espaço) */}
      <div className="border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl sm:sticky sm:top-0 sm:z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
          <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight text-ink">Semana</h1>
          <WeekNav
            period={periodLabel(days)}
            offset={offset}
            mode={weekMode}
            onPrevious={props.onPrevious}
            onNext={props.onNext}
            onModeChange={props.onModeChange}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        {loaded && <WeekSummary habits={habits} checks={checks} goals={goals} days={days} today={today} />}

        {loaded ? (
          <Card className="flex overflow-hidden p-2 sm:p-4">
            <HabitList habits={habits} days={days} checks={checks} goals={goals} onEdit={props.onEdit} onMove={props.onMove} />
            <WeekGrid days={days} today={today} habits={habits} checks={checks} onToggle={props.onToggle} />
          </Card>
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
}
