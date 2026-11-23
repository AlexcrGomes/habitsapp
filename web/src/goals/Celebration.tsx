import { useEffect, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { CelebrationData } from "./celebrationRules";

/** Comemoração em exibição: o id distingue duas comemorações seguidas do mesmo hábito. */
export interface ActiveCelebration extends CelebrationData {
  id: number;
  /** A marcação foi na semana anterior (spec 010 permite editá-la) */
  lastWeek: boolean;
}

/** Tempo na tela: some sozinha antes de 4 s (spec 012, CS-003). */
export const CELEBRATION_MS = 3500;

const COLORS = ["#2563eb", "#60a5fa", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

export function celebrationText(data: ActiveCelebration): { title: string; message: string; detail: string | null } {
  const when = data.lastWeek ? "na semana passada" : "nesta semana";
  if (data.kind === "week") {
    return {
      title: "Semana perfeita!",
      message: `Você bateu todas as metas ${data.lastWeek ? "da semana passada" : "da semana"}.`,
      detail: null,
    };
  }
  const days = `${data.done >= data.goal ? data.goal : data.done} de ${data.goal} ${data.goal === 1 ? "dia" : "dias"}`;
  return {
    title: "Parabéns!",
    message: `Você bateu a meta de ${data.habit.name} ${when}.`,
    detail: data.habit.objective ? `${data.habit.objective} — ${days} ✓` : null,
  };
}

/** Peças de confete com posição, atraso, cor e giro variando pelo índice (determinístico, sem Math.random). */
function confetti(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const style: CSSProperties & Record<`--${string}`, string> = {
      left: `${(index * 37 + 7) % 100}%`,
      top: `${(index * 13) % 20}%`,
      width: index % 3 === 0 ? "6px" : "8px",
      height: index % 2 === 0 ? "12px" : "8px",
      background: COLORS[index % COLORS.length],
      borderRadius: index % 4 === 0 ? "9999px" : "2px",
      animationDelay: `${(index * 53) % 300}ms`,
      "--confetti-drift": `${((index * 29) % 120) - 60}px`,
      "--confetti-spin": `${360 + ((index * 97) % 540)}deg`,
    };
    return <span key={index} data-confetti className="absolute block motion-safe:animate-confetti-fall" style={style} />;
  });
}

interface CelebrationProps {
  celebration: ActiveCelebration | null;
  onClose: () => void;
}

/**
 * Aviso de parabéns com confete (spec 012, US3–US5). A região role="status" fica sempre montada
 * para o leitor de tela anunciar cada comemoração sem mover o foco. Nada aqui recebe toque
 * (pointer-events-none): qualquer toque, Esc ou 3,5 s fecham o aviso, e o toque segue para a tela.
 * Com "reduzir movimento", não há confete nem entrada animada: só o cartão parado.
 */
export function Celebration({ celebration, onClose }: CelebrationProps) {
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(onClose, CELEBRATION_MS);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onClose, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onClose, true);
    };
  }, [celebration, onClose]);

  const text = celebration && celebrationText(celebration);
  const week = celebration?.kind === "week";

  return (
    <div role="status" aria-live="polite" data-celebration={celebration?.kind}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {celebration && text && (
        <>
          <div aria-hidden="true" className="absolute inset-0 motion-reduce:hidden">
            {confetti(week ? 48 : 24)}
          </div>
          {/* Celular: acima da barra de navegação de baixo; computador: no topo */}
          <div className="absolute inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] flex justify-center px-4 lg:top-6 lg:bottom-auto lg:pl-64">
            <div key={celebration.id}
              className={cn("flex max-w-sm items-start gap-3 rounded-xl border bg-white shadow-lg motion-safe:animate-celebrate-in",
                week ? "border-brand-200 px-5 py-4" : "border-slate-200 px-4 py-3")}>
              <span aria-hidden="true" className={week ? "text-3xl" : "text-2xl"}>{week ? "🏆" : "🎉"}</span>
              <div className="min-w-0">
                <p className={cn("font-semibold text-ink", week ? "text-lg" : "text-base")}>{text.title}</p>
                <p className="text-sm text-slate-700">{text.message}</p>
                {text.detail && <p className="mt-1 text-sm break-words text-slate-600">{text.detail}</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
