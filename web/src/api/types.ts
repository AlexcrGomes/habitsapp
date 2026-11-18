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

/** Preferências de notificação da conta (spec 011). */
export interface NotificationSettings {
  /** false sem as chaves do servidor: notificações indisponíveis */
  available: boolean;
  /** Chave pública VAPID (base64url) para a inscrição de push */
  publicKey: string | null;
  /** "HH:mm", horário de Brasília */
  reminderTime: string;
  daily: boolean;
  atRisk: boolean;
  summary: boolean;
}

export interface PushDevice {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
