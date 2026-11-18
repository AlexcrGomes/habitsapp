import { ChevronDown, ChevronUp, GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Habit } from "../api/types";
import type { Goals } from "../goals/progress";
import { HabitLabel } from "./HabitLabel";
import { useReorder } from "./useReorder";

interface HabitListProps {
  habits: Habit[];
  /** Semana exibida, marcações e metas vigentes nela, para a barra de cada meta */
  days: string[];
  checks: Set<string>;
  goals: Goals;
  onEdit: (habit: Habit) => void;
  onMove: (id: number, toIndex: number) => void;
}

/** "Novo hábito" e "Arquivados" ficam na navegação principal (spec 009). */
export function HabitList({ habits, days, checks, goals, onEdit, onMove }: HabitListProps) {
  const { listProps, startDrag, moveByButton } = useReorder(habits, onMove);

  return (
    // Altura das linhas (h-16) e do cabeçalho (mt-14) iguais às da WeekGrid: as linhas ficam alinhadas
    <div className="w-52 shrink-0 pr-2 sm:w-64 lg:w-72 xl:w-80">
      <ul className="habits mt-14" {...listProps}>
        {habits.map((habit, index) => (
          <li key={habit.id} className="habit flex h-16 items-center gap-1.5 border-t border-slate-100 pr-1 sm:gap-2.5" data-id={habit.id}>
            <span className="habit-handle grid h-full cursor-grab touch-none select-none place-items-center px-0.5 text-slate-400 hover:text-slate-600"
              title="Arrastar para reordenar" aria-hidden="true" onPointerDown={(event) => startDrag(event, habit)}>
              <GripVertical className="size-4" />
            </span>
            <HabitLabel habit={habit} days={days} checks={checks} goals={goals} />
            <span className="habit-move flex flex-col">
              <Button variant="ghost" size="icon" className="size-6" data-action="up" aria-label={`Mover ${habit.name} para cima`}
                disabled={index === 0} onClick={() => moveByButton(habit, index, "up")}>
                <ChevronUp aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" data-action="down" aria-label={`Mover ${habit.name} para baixo`}
                disabled={index === habits.length - 1} onClick={() => moveByButton(habit, index, "down")}>
                <ChevronDown aria-hidden="true" />
              </Button>
            </span>
            <Button variant="ghost" size="icon" className="size-8" data-action="edit" aria-label={`Editar ${habit.name}`} title="Editar"
              onClick={() => onEdit(habit)}>
              <Pencil aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      {habits.length === 0 && (
        <p className="border-t border-slate-100 py-5 pl-2 text-sm text-slate-500">Crie seu primeiro hábito</p>
      )}
    </div>
  );
}
