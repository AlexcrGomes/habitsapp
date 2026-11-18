import { cn } from "@/lib/cn";
import type { Habit } from "../api/types";
import { formatDay, isEditable, lockReason } from "./dates";

interface DayCheckProps {
  habit: Habit;
  day: string;
  today: string;
  checked: boolean;
  /** Só a caixa que a pessoa acabou de marcar anima o "encaixe" (spec 009, US5). */
  animate: boolean;
  /** Tamanho e ajustes de layout de cada tela (a aparência base é a .habit-check). */
  className?: string;
  onChange: (checked: boolean) => void;
}

/** Marcação de um dia, comum à grade do desktop e à lista do celular (spec 010, plan P6). */
export function DayCheck({ habit, day, today, checked, animate, className, onChange }: DayCheckProps) {
  return (
    <input
      type="checkbox"
      className={cn("habit-check", className, checked && animate && "motion-safe:animate-block-in")}
      aria-label={`${habit.name} em ${formatDay(day)}${lockReason(day, today)}`}
      checked={checked}
      disabled={!isEditable(day, today)}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
