import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface WeekNavProps {
  period: string;
  /** Semanas atrás da atual (0 = semana atual). */
  offset: number;
  /** Celular: setas menores, para o topo ocupar menos altura (spec 010, plan P10). */
  compact?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** ‹ período › da semana exibida (segunda a domingo; spec 010, revisão 2: sem escolha de modo). */
export function WeekNav({ period, offset, compact = false, onPrevious, onNext }: WeekNavProps) {
  const previousRef = useRef<HTMLButtonElement>(null);

  function next() {
    onNext();
    // Ao chegar na semana atual o › fica desabilitado; o foco passa para ‹
    if (offset === -1) requestAnimationFrame(() => previousRef.current?.focus());
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Navegação entre semanas">
      <Button ref={previousRef} size="icon" className={cn(compact && "size-9")} aria-label="Semana anterior" onClick={onPrevious}>
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className={cn("text-center text-sm font-semibold tabular-nums text-ink", compact ? "min-w-24" : "min-w-28")} aria-live="polite">{period}</span>
      <Button size="icon" className={cn(compact && "size-9")} aria-label="Próxima semana" disabled={offset >= 0} onClick={next}>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
