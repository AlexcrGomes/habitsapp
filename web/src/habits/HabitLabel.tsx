import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Habit } from "../api/types";
import { GoalBar } from "../goals/GoalBar";
import { type Goals, doneCount } from "../goals/progress";
import { habitSymbol } from "./rules";

interface GoalProps {
  habit: Habit;
  /** Semana exibida, marcações e metas vigentes nela */
  days: string[];
  checks: Set<string>;
  goals: Goals;
}

/**
 * Selo da meta: "X/N" em azul ou ✓ em verde ao atingir (spec 009, US4.3). Visual só
 * (aria-hidden); o leitor de tela ouve a GoalBar. `label` mostra "Meta atingida" quando há espaço.
 */
export function GoalBadge({ habit, days, checks, goals, label = false }: GoalProps & { label?: boolean }) {
  const goal = goals.get(habit.id);
  if (goal === undefined) return null;
  const done = Math.min(doneCount(habit.id, days, checks), goal);
  return done === goal ? (
    <Badge variant="success" aria-hidden="true" className="shrink-0 px-1.5">
      <Check />
      {label && <span className="hidden @[9rem]:inline">Meta atingida</span>}
    </Badge>
  ) : (
    <Badge aria-hidden="true" className="shrink-0 px-1.5 tabular-nums">{done}/{goal}</Badge>
  );
}

/**
 * Símbolo, nome e progresso da meta de um hábito na lista do desktop (spec 010, plan P8).
 * Devolve dois irmãos para ficarem direto na linha flex de quem usa.
 */
export function HabitLabel({ habit, days, checks, goals }: GoalProps) {
  const goal = goals.get(habit.id);
  return (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-50 text-base ring-1 ring-inset ring-brand-100 sm:size-10 sm:text-lg"
        aria-hidden="true">
        {habitSymbol(habit)}
      </span>
      <span className="@container flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm font-medium text-ink" title={habit.name}>{habit.name}</span>
        {goal !== undefined && (
          <span className="flex items-center gap-2">
            <GoalBar name={habit.name} done={doneCount(habit.id, days, checks)} goal={goal} />
            <GoalBadge habit={habit} days={days} checks={checks} goals={goals} label />
          </span>
        )}
      </span>
    </>
  );
}
