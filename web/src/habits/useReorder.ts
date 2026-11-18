import { useLayoutEffect, useRef, type PointerEvent } from "react";
import type { Habit } from "../api/types";

interface DragState {
  id: number;
  item: HTMLLIElement;
  pointerId: number;
  startY: number;
  toIndex: number | null;
}

/**
 * Reordenar hábitos arrastando pela alça (mouse e toque) ou pelos botões ↑/↓, comum à lista do
 * desktop e à do celular (spec 010, plan P7). A lista é um <ul> cujos <li> têm `data-id`; os
 * botões ↑/↓ ficam em `.habit-move` com `data-action="up|down"`. As classes `dragging`,
 * `drop-before` e `drop-after` são estilizadas no index.css.
 */
export function useReorder(habits: Habit[], onMove: (id: number, toIndex: number) => void) {
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

  function startDrag(event: PointerEvent<HTMLElement>, habit: Habit) {
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

  /** Props do <ul> da lista. */
  const listProps = { ref: listRef, onPointerMove: moveDrag, onPointerUp: endDrag, onPointerCancel: endDrag };

  return { listProps, startDrag, moveByButton };
}
