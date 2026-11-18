import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Habit } from "../api/types";
import { GoalBar } from "../goals/GoalBar";
import { type Goals, doneCount } from "../goals/progress";
import { DayCheck } from "../week/DayCheck";
import { HABIT_COLUMN, WEEK_ROW_GRID } from "../week/DayStrip";
import { GoalBadge } from "./HabitLabel";
import { checkKey, habitSymbol } from "./rules";
import { useReorder } from "./useReorder";

interface HabitRowsProps {
  habits: Habit[];
  days: string[];
  today: string;
  checks: Set<string>;
  goals: Goals;
  onToggle: (habitId: number, day: string, checked: boolean) => void;
  onEdit: (habit: Habit) => void;
  onMove: (id: number, toIndex: number) => void;
}

/**
 * Semana no celular (spec 010, rev. 3, P24): cada hábito numa linha — na 1ª coluna, a alça, o
 * emoji com o selo da meta e o nome embaixo; nas 7 colunas seguintes, as marcações. A faixa de
 * dias (DayStrip) usa a mesma grade, então fica alinhada por construção. Não usa a classe
 * .days: não há o que rolar na horizontal, e o scrollToToday não faz nada aqui.
 */
export function HabitRows({ habits, days, today, checks, goals, onToggle, onEdit, onMove }: HabitRowsProps) {
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const { listProps, startDrag, moveByButton } = useReorder(habits, onMove);
  const todayIndex = days.indexOf(today);
  const dayWidth = `(100% - ${HABIT_COLUMN}) / 7`;

  return (
    <div className="relative">
      {/* Coluna de hoje: fundo contínuo atrás de todos os hábitos, na mesma grade (plan P20, P24) */}
      {todayIndex >= 0 && habits.length > 0 && (
        <div data-today-column aria-hidden="true" className="pointer-events-none absolute inset-y-0 rounded-b-md bg-brand-50"
          style={{ left: `calc(${HABIT_COLUMN} + ${todayIndex} * ${dayWidth} + 2px)`, width: `calc(${dayWidth} - 4px)` }} />
      )}

      {/* relative: as linhas pintam por cima da coluna de hoje */}
      <ul className="habits relative" {...listProps}>
        {habits.map((habit, index) => {
          const goal = goals.get(habit.id);
          return (
            <li key={habit.id} className={cn(WEEK_ROW_GRID, "habit relative items-center border-t border-slate-100 py-1.5 first:border-t-0")}
              data-id={habit.id}>
              <div className="flex min-w-0 items-center">
                <span className="habit-handle grid h-12 w-3 shrink-0 cursor-grab touch-none select-none place-items-center text-slate-400 hover:text-slate-600"
                  title="Arrastar para reordenar" aria-hidden="true" onPointerDown={(event) => startDrag(event, habit)}>
                  <GripVertical className="size-3.5" />
                </span>
                {/* Tocar no emoji ou no nome edita (rev. 3); o nome acessível continua "Editar {nome}" */}
                <button type="button" data-action="edit" aria-label={`Editar ${habit.name}`} title={habit.name}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 rounded-md px-0.5 py-0.5 text-left"
                  onClick={() => onEdit(habit)}>
                  <span className="flex items-center gap-1">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-50 text-base ring-1 ring-inset ring-brand-100"
                      aria-hidden="true">
                      {habitSymbol(habit)}
                    </span>
                    <GoalBadge habit={habit} days={days} checks={checks} goals={goals} />
                  </span>
                  <span className="line-clamp-2 w-full text-xs leading-tight font-medium break-words text-ink">{habit.name}</span>
                </button>
                {/* A barra fica fora do botão: um botão não expõe ao leitor de tela os papéis de dentro dele */}
                {goal !== undefined && (
                  <span className="sr-only">
                    <GoalBar name={habit.name} done={doneCount(habit.id, days, checks)} goal={goal} />
                  </span>
                )}
                {/* ↑/↓ fora da vista no celular; aparecem sobre a linha enquanto têm o foco do teclado (plan P8) */}
                <span className="habit-move absolute top-1 left-1 z-20 flex rounded-md bg-white shadow-sm not-focus-within:sr-only">
                  <Button variant="ghost" size="icon" className="size-8" data-action="up" aria-label={`Mover ${habit.name} para cima`}
                    disabled={index === 0} onClick={() => moveByButton(habit, index, "up")}>
                    <ChevronUp aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" data-action="down" aria-label={`Mover ${habit.name} para baixo`}
                    disabled={index === habits.length - 1} onClick={() => moveByButton(habit, index, "down")}>
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </span>
              </div>

              {/* Célula inteira do dia (coluna × 44 px) responde ao toque; a caixa visível tem 28 px (rev. 3) */}
              {days.map((day) => {
                const key = checkKey(habit.id, day);
                return (
                  <label key={day} data-today={day === today || undefined} className="grid h-11 cursor-pointer place-items-center">
                    <DayCheck habit={habit} day={day} today={today} checked={checks.has(key)} animate={justChecked === key} className="size-7 max-[359px]:size-6"
                      onChange={(value) => {
                        if (value) setJustChecked(key);
                        onToggle(habit.id, day, value);
                      }} />
                  </label>
                );
              })}
            </li>
          );
        })}
      </ul>

      {habits.length === 0 && (
        <p className="py-5 pl-2 text-sm text-slate-500">Crie seu primeiro hábito</p>
      )}
    </div>
  );
}
