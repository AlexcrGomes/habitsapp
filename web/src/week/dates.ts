import type { WeekMode } from "../api/types";

/**
 * Datas como chave "YYYY-MM-DD". A aritmética é feita em UTC, para não depender do fuso da
 * máquina; o "hoje" segue o horário de Brasília, igual à API (spec 005, RF-010).
 */

export const ZONE = "America/Sao_Paulo";
export const EDITABLE_DAYS = 7; // hoje + 6 dias anteriores

// en-CA formata como "YYYY-MM-DD"
const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

export function todayKey(now: Date = new Date()): string {
  return keyFormat.format(now);
}

export function fromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, amount: number): string {
  const date = fromKey(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return toKey(date);
}

/** "rolling" = hoje + 6 anteriores; "calendar" = domingo a sábado. offset em semanas (0 = atual). */
export function visibleDays(mode: WeekMode, offset: number, today: string): string[] {
  const start =
    mode === "calendar"
      ? addDays(today, -fromKey(today).getUTCDay() + 7 * offset)
      : addDays(today, 7 * offset - (EDITABLE_DAYS - 1));

  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function isFuture(day: string, today: string): boolean {
  return day > today;
}

export function isEditable(day: string, today: string): boolean {
  return day >= addDays(today, -(EDITABLE_DAYS - 1)) && day <= today;
}

/** Sufixo do rótulo acessível de dias bloqueados. */
export function lockReason(day: string, today: string): string {
  if (isFuture(day, today)) return " (dia futuro)";
  if (!isEditable(day, today)) return " (somente consulta)";
  return "";
}

/** "YYYY-MM-DD" → "DD/MM" */
export function formatDay(key: string): string {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

/** "YYYY-MM-DD" → "sex" */
export function weekdayShort(key: string): string {
  return weekdayFormat.format(fromKey(key)).replace(".", "");
}

export function periodLabel(days: string[]): string {
  return `${formatDay(days[0])} – ${formatDay(days[days.length - 1])}`;
}
