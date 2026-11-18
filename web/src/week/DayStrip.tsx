import { cn } from "@/lib/cn";
import { weekdayShort } from "./dates";

/**
 * Grade da Semana no celular: 84px para o hábito e 7 colunas iguais para os dias (spec 010,
 * rev. 3, P24). A faixa de dias e as linhas de hábitos usam a mesma, então ficam alinhadas.
 */
export const WEEK_ROW_GRID = "grid grid-cols-[5.25rem_repeat(7,minmax(0,1fr))]";
export const HABIT_COLUMN = "5.25rem";

interface DayStripProps {
  days: string[];
  today: string;
}

/**
 * Faixa com os 7 dias da semana no celular (spec 010). A primeira célula fica vazia, sobre a
 * coluna dos hábitos. Hoje em destaque forte: fundo brand-600 e texto branco (5,2:1), com
 * aria-current="date" (plan P20).
 */
export function DayStrip({ days, today }: DayStripProps) {
  return (
    <div className={cn(WEEK_ROW_GRID, "py-1.5")}>
      <div aria-hidden="true" />
      {days.map((day) => {
        const isToday = day === today;
        return (
          <div key={day} data-day={day} aria-current={isToday ? "date" : undefined}
            className={cn("mx-0.5 flex flex-col items-center rounded-md py-0.5 leading-tight", isToday && "bg-brand-600")}>
            <span className={cn("text-xs font-medium", isToday ? "text-white" : "text-slate-500")}>{weekdayShort(day)}</span>
            <span className={cn("text-sm font-semibold tabular-nums", isToday ? "text-white" : "text-ink")}>{day.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}
