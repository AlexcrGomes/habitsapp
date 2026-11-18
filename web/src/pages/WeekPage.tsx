import { useEffect } from "react";
import type { Habit } from "@/api/types";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { WeekSummary } from "@/goals/WeekSummary";
import type { Goals } from "@/goals/progress";
import { HabitList } from "@/habits/HabitList";
import { HabitRows } from "@/habits/HabitRows";
import { cn } from "@/lib/cn";
import { SHORT_QUERY, useMediaQuery, useMobileLayout } from "@/lib/useMobileLayout";
import { DayStrip } from "@/week/DayStrip";
import { periodLabel } from "@/week/dates";
import { WeekGrid, scrollToToday } from "@/week/WeekGrid";
import { WeekNav } from "@/week/WeekNav";

interface WeekPageProps {
  days: string[];
  today: string;
  /** Semanas atrás da atual (0 = semana atual). */
  offset: number;
  habits: Habit[];
  checks: Set<string>;
  goals: Goals;
  loaded: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggle: (habitId: number, day: string, checked: boolean) => void;
  onMove: (id: number, toIndex: number) => void;
  onEdit: (habit: Habit) => void;
}

/**
 * Tela principal ("/"): semana exibida (segunda a domingo), resumo, hábitos e marcações. No
 * celular usa a lista empilhada (HabitRows); fora dele, a lista + grade da spec 009. Só um dos
 * dois fica no DOM (spec 010, plan P1).
 */
export function WeekPage(props: WeekPageProps) {
  const { days, today, offset, habits, checks, goals, loaded } = props;
  const mobile = useMobileLayout();
  const short = useMediaQuery(SHORT_QUERY);

  // Tablet: a grade abre rolada até hoje (também ao voltar de outra tela); no celular não há o que rolar
  useEffect(() => {
    if (offset === 0 && loaded) scrollToToday();
  }, [offset, loaded, today, mobile]);

  // Título e, logo embaixo, ‹ período › (spec 010, revisão 2, P18)
  const title = (
    <>
      <h1 tabIndex={-1} className={cn("font-semibold tracking-tight text-ink", mobile ? "text-xl" : "text-2xl")}>Semana</h1>
      <WeekNav period={periodLabel(days)} offset={offset} compact={mobile} onPrevious={props.onPrevious} onNext={props.onNext} />
    </>
  );

  if (mobile) {
    const rows = (
      <HabitRows habits={habits} days={days} today={today} checks={checks} goals={goals}
        onToggle={props.onToggle} onEdit={props.onEdit} onMove={props.onMove} />
    );
    return (
      <>
        {/* Topo fixo (P19): título, semana, resumo e faixa de dias; só os hábitos rolam por baixo.
            Celular deitado (pouca altura): o topo rola e só a faixa de dias fica fixa. */}
        <div data-week-top className={cn("bg-slate-50/95 backdrop-blur-xl", !short && "sticky top-0 z-20")}>
          <div className="mx-auto max-w-xl px-3 pt-2">
            <div className="flex flex-col items-start gap-1">{title}</div>
            {loaded && (
              <div className="mt-2">
                <WeekSummary habits={habits} checks={checks} goals={goals} days={days} today={today} compact />
              </div>
            )}
            {loaded && !short && (
              <div className="mt-3 rounded-t-lg border border-b-0 border-slate-200 bg-white px-2">
                <div className="border-b border-slate-200"><DayStrip days={days} today={today} /></div>
              </div>
            )}
          </div>
        </div>

        <div className={cn("mx-auto max-w-xl px-3 pb-3", short && "pt-3")}>
          {!loaded && <Loading />}
          {loaded && !short && (
            <Card className="rounded-t-none border-t-0 px-2 pb-1">{rows}</Card>
          )}
          {loaded && short && (
            // Sem overflow-hidden no cartão: a faixa de dias é sticky
            <Card className="px-2 pb-1">
              <div className="sticky top-0 z-10 -mx-2 rounded-t-lg border-b border-slate-200 bg-white/95 px-2 backdrop-blur">
                <DayStrip days={days} today={today} />
              </div>
              {rows}
            </Card>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Cabeçalho de vidro, fixo a partir de 640 px */}
      <div className="border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-xl sm:sticky sm:top-0 sm:z-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
          {title}
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
