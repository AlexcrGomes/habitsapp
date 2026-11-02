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
}

export interface Check {
  habitId: number;
  /** "YYYY-MM-DD" */
  day: string;
}
