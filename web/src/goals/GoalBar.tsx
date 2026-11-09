import { cn } from "@/lib/cn";
import { habitProgress } from "./progress";

interface GoalBarProps {
  name: string;
  done: number;
  goal: number;
}

/** Progresso da meta na semana exibida; o leitor de tela ouve "Correr: 2 de 4 dias". */
export function GoalBar({ name, done, goal }: GoalBarProps) {
  const value = Math.min(done, goal);
  const reached = value === goal;
  const text = `${name}: ${value} de ${goal} ${goal === 1 ? "dia" : "dias"}${reached ? ", meta atingida" : ""}`;

  return (
    <span className="block h-1.5 w-full max-w-28 min-w-6 overflow-hidden rounded-full bg-slate-200" role="progressbar"
      aria-label={`Meta de ${name}`} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value} aria-valuetext={text} title={text}>
      <span
        className={cn("block h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none",
          reached ? "bg-success" : "bg-brand-600")}
        style={{ width: `${habitProgress(done, goal) * 100}%` }}
      />
    </span>
  );
}
