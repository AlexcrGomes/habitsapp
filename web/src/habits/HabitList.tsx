import { useLayoutEffect, useRef, type PointerEvent } from "react";
import type { Habit } from "../api/types";
import { GoalBar } from "../goals/GoalBar";
import { type Goals, doneCount } from "../goals/progress";
import { MAX_ACTIVE, habitSymbol } from "./rules";

interface HabitListProps {
  habits: Habit[];
  /** Semana exibida, marcações e metas vigentes nela, para a barra de cada meta */
  days: string[];
  checks: Set<string>;
  goals: Goals;
  archivedCount: number;
  onNew: () => void;
  onEdit: (habit: Habit) => void;
  onOpenArchived: () => void;
  onMove: (id: number, toIndex: number) => void;
}

interface DragState {
  id: number;
  item: HTMLLIElement;
  pointerId: number;
  startY: number;
  toIndex: number | null;
}

export function HabitList({ habits, days, checks, goals, archivedCount, onNew, onEdit, onOpenArchived, onMove }: HabitListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<DragState | null>(null);
  const pendingFocus = useRef<{ id: number; direction: "up" | "down" } | null>(null);
  const limitReached = habits.length >= MAX_ACTIVE;

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
    <div className="habits-column">
      <ul className="habits" ref={listRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {habits.map((habit, index) => (
          <li key={habit.id} className="habit" data-id={habit.id}>
            <span className="habit-handle" title="Arrastar para reordenar" aria-hidden="true"
              onPointerDown={(event) => startDrag(event, habit)}>⠿</span>
            <span className="habit-symbol" aria-hidden="true">{habitSymbol(habit)}</span>
            <span className="habit-info">
              <span className="habit-name" title={habit.name}>{habit.name}</span>
              {goals.has(habit.id) && (
                <GoalBar name={habit.name} done={doneCount(habit.id, days, checks)} goal={goals.get(habit.id)!} />
              )}
            </span>
            <span className="habit-move">
              <button type="button" data-action="up" aria-label={`Mover ${habit.name} para cima`}
                disabled={index === 0} onClick={() => moveByButton(habit, index, "up")}>↑</button>
              <button type="button" data-action="down" aria-label={`Mover ${habit.name} para baixo`}
                disabled={index === habits.length - 1} onClick={() => moveByButton(habit, index, "down")}>↓</button>
            </span>
            <button type="button" data-action="edit" aria-label={`Editar ${habit.name}`} onClick={() => onEdit(habit)}>✎</button>
          </li>
        ))}
      </ul>

      <div className="habits-actions">
        {habits.length === 0 && <p className="habits-empty">Crie seu primeiro hábito</p>}
        <button type="button" data-action="new" disabled={limitReached} onClick={onNew}>
          {limitReached ? `Limite de ${MAX_ACTIVE} hábitos ativos` : "+ Novo hábito"}
        </button>
        {archivedCount > 0 && (
          <button type="button" data-action="archived" onClick={onOpenArchived}>Arquivados ({archivedCount})</button>
        )}
      </div>
    </div>
  );
}
