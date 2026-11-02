import { useRef } from "react";
import type { WeekMode } from "../api/types";

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
    <nav className="week-nav" aria-label="Navegação entre semanas">
      <div className="week-arrows">
        <button ref={previousRef} type="button" aria-label="Semana anterior" onClick={onPrevious}>‹</button>
        <span className="week-period" aria-live="polite">{period}</span>
        <button type="button" aria-label="Próxima semana" disabled={offset >= 0} onClick={next}>›</button>
      </div>
      <fieldset className="week-mode">
        <legend className="visually-hidden">Dias exibidos</legend>
        {MODES.map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="week-mode" value={value} checked={mode === value}
              onChange={() => onModeChange(value)} />
            {" "}{label}
          </label>
        ))}
      </fieldset>
    </nav>
  );
}
