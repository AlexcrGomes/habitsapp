import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { WeekMode } from "@/api/types";
import { Button } from "@/components/ui/button";

const MODES: [WeekMode, string][] = [
  ["rolling", "Últimos 7 dias"],
  ["calendar", "Dom–Sáb"],
];

interface WeekNavProps {
  period: string;
  /** Semanas atrás da atual (0 = semana atual). */
  offset: number;
  mode: WeekMode;
  onPrevious: () => void;
  onNext: () => void;
  onModeChange: (mode: WeekMode) => void;
}

export function WeekNav({ period, offset, mode, onPrevious, onNext, onModeChange }: WeekNavProps) {
  const previousRef = useRef<HTMLButtonElement>(null);

  function next() {
    onNext();
    // Ao chegar na semana atual o › fica desabilitado; o foco passa para ‹
    if (offset === -1) requestAnimationFrame(() => previousRef.current?.focus());
  }

  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label="Navegação entre semanas">
      <div className="flex items-center gap-1">
        <Button ref={previousRef} size="icon" aria-label="Semana anterior" onClick={onPrevious}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="min-w-28 text-center text-sm font-semibold tabular-nums text-ink" aria-live="polite">{period}</span>
        <Button size="icon" aria-label="Próxima semana" disabled={offset >= 0} onClick={next}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {/* Controle segmentado com rádios nativos (teclado e leitor de tela continuam funcionando) */}
      <fieldset className="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
        <legend className="sr-only">Dias exibidos</legend>
        {MODES.map(([value, label]) => (
          <label key={value}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-ink has-checked:bg-white has-checked:text-ink has-checked:shadow-xs has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500 motion-reduce:transition-none">
            <input type="radio" name="week-mode" value={value} checked={mode === value} className="sr-only"
              onChange={() => onModeChange(value)} />
            {label}
          </label>
        ))}
      </fieldset>
    </nav>
  );
}
