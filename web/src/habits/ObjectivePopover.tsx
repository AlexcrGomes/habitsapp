import { Pencil } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { Habit } from "../api/types";

interface ObjectivePopoverProps {
  id: string;
  habit: Habit;
  /** Botão do hábito que abriu o balão: toques nele não contam como "fora" e o foco volta para ele */
  anchor: RefObject<HTMLButtonElement | null>;
  onEdit: () => void;
  onClose: () => void;
}

/**
 * Balão do objetivo no celular (spec 012, US2, plan P11): nome, objetivo completo e "Editar".
 * Disclosure simples, não modal: fecha com Esc ou com um toque fora, sem engolir esse toque.
 */
export function ObjectivePopover({ id, habit, anchor, onEdit, onClose }: ObjectivePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    editRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchor.current?.contains(target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      anchor.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, onClose]);

  return (
    <div ref={ref} id={id} data-objective-popover
      className="absolute top-full left-1 z-30 -mt-1 w-[min(18rem,calc(100%-0.5rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-lg motion-safe:animate-dialog-in">
      <p className="text-sm font-semibold text-ink">{habit.name}</p>
      <p className="mt-1 text-sm break-words text-slate-600">{habit.objective}</p>
      <Button ref={editRef} size="sm" className="mt-3" onClick={onEdit}>
        <Pencil aria-hidden="true" />
        Editar
      </Button>
    </div>
  );
}
