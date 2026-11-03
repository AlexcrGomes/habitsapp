export type WeekMode = "rolling" | "calendar";

export interface User {
  id: number;
  name: string;
  email: string;
  weekMode: WeekMode;
}

export interface Habit {
  id: number;
  name: string;
  emoji: string;
  archived: boolean;
  /** Meta vigente hoje, em dias por semana (1 a 7); null = sem meta (spec 006) */
  goal: number | null;
}

export interface Goal {
  habitId: number;
  daysPerWeek: number;
}

export interface Check {
  habitId: number;
  /** "YYYY-MM-DD" */
  day: string;
}
