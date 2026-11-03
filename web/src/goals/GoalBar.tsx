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
    <span className={reached ? "goal-bar reached" : "goal-bar"} role="progressbar" aria-label={`Meta de ${name}`}
      aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value} aria-valuetext={text} title={text}>
      <span className="goal-bar-fill" style={{ width: `${habitProgress(done, goal) * 100}%` }} />
    </span>
  );
}
