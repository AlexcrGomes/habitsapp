import { Check, ChevronDown, ChevronUp, GripVertical, Pencil } from "lucide-react";
import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Habit } from "../api/types";
import { GoalBar } from "../goals/GoalBar";
import { type Goals, doneCount } from "../goals/progress";
import { habitSymbol } from "./rules";

interface HabitListProps {
  habits: Habit[];
  /** Semana exibida, marcações e metas vigentes nela, para a barra de cada meta */
  days: string[];
  checks: Set<string>;
  goals: Goals;
  onEdit: (habit: Habit) => void;
  onMove: (id: number, toIndex: number) => void;
}

interface DragState {
  id: number;
  item: HTMLLIElement;
  pointerId: number;
  startY: number;
  toIndex: number | null;
}

/** "Novo hábito" e "Arquivados" ficam na navegação principal (spec 009). */
export function HabitList({ habits, days, checks, goals, onEdit, onMove }: HabitListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<DragState | null>(null);
  const pendingFocus = useRef<{ id: number; direction: "up" | "down" } | null>(null);

  // Depois de mover com ↑/↓ o foco continua no mesmo botão; se ele ficou desabilitado, vai para o outro
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    const row = listRef.current?.querySelector(`[data-id="${pending.id}"]`);
    const button = row?.querySelector<HTMLButtonElement>(`[data-action="${pending.direction}"]`);
    const target = button && !button.disabled ? button : row?.querySelector<HTMLButtonElement>(".habit-move button:not(:disabled)");
    target?.focus();
  }, [habits]);

  function moveByButton(habit: Habit, index: number, direction: "up" | "down") {
    pendingFocus.current = { id: habit.id, direction };
    onMove(habit.id, direction === "up" ? index - 1 : index + 1);
  }

  // --- Arrastar pela alça (mouse e toque) ---

  function startDrag(event: PointerEvent<HTMLSpanElement>, habit: Habit) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const item = event.currentTarget.closest("li")!;
    item.classList.add("dragging");
    drag.current = { id: habit.id, item, pointerId: event.pointerId, startY: event.clientY, toIndex: null };
  }

  function moveDrag(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId || !listRef.current) return;

    state.item.style.transform = `translateY(${event.clientY - state.startY}px)`;

    // Destino = quantos outros itens têm o meio acima do ponteiro
    const others = [...listRef.current.children].filter((item) => item !== state.item) as HTMLElement[];
    state.toIndex = others.filter((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top + rect.height / 2 < event.clientY;
    }).length;

    others.forEach((item) => item.classList.remove("drop-before", "drop-after"));
    if (state.toIndex < others.length) others[state.toIndex].classList.add("drop-before");
    else others.at(-1)?.classList.add("drop-after");
  }

  function endDrag(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId || !listRef.current) return;
    drag.current = null;

    for (const item of listRef.current.children as HTMLCollectionOf<HTMLElement>) {
      item.classList.remove("dragging", "drop-before", "drop-after");
      item.style.transform = "";
    }
    if (event.type === "pointerup" && state.toIndex !== null) onMove(state.id, state.toIndex);
  }

  return (
    // Altura das linhas (h-16) e do cabeçalho (mt-14) iguais às da WeekGrid: as linhas ficam alinhadas
    <div className="w-52 shrink-0 pr-2 sm:w-64 lg:w-72 xl:w-80">
      <ul className="habits mt-14" ref={listRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {habits.map((habit, index) => {
          const goal = goals.get(habit.id);
          const done = goal ? Math.min(doneCount(habit.id, days, checks), goal) : 0;
          return (
            <li key={habit.id} className="habit flex h-16 items-center gap-1.5 border-t border-slate-100 pr-1 sm:gap-2.5" data-id={habit.id}>
              <span className="habit-handle grid h-full cursor-grab touch-none select-none place-items-center px-0.5 text-slate-400 hover:text-slate-600"
                title="Arrastar para reordenar" aria-hidden="true" onPointerDown={(event) => startDrag(event, habit)}>
                <GripVertical className="size-4" />
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-50 text-base ring-1 ring-inset ring-brand-100 sm:size-10 sm:text-lg"
                aria-hidden="true">
                {habitSymbol(habit)}
              </span>
              <span className="@container flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-sm font-medium text-ink" title={habit.name}>{habit.name}</span>
                {goal !== undefined && (
                  <span className="flex items-center gap-2">
                    <GoalBar name={habit.name} done={doneCount(habit.id, days, checks)} goal={goal} />
                    {done === goal ? (
                      <Badge variant="success" aria-hidden="true" className="shrink-0 px-1.5">
                        <Check />
                        <span className="hidden @[9rem]:inline">Meta atingida</span>
                      </Badge>
                    ) : (
                      <Badge aria-hidden="true" className="shrink-0 px-1.5 tabular-nums">{done}/{goal}</Badge>
                    )}
                  </span>
                )}
              </span>
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
          );
        })}
      </ul>

      {habits.length === 0 && (
        <p className="border-t border-slate-100 py-5 pl-2 text-sm text-slate-500">Crie seu primeiro hábito</p>
      )}
    </div>
  );
}
