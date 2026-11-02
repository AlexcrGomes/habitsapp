import type { Habit } from "../api/types";

/** Espelho das regras da API para resposta imediata; a API continua sendo a fonte de verdade. */

export const MAX_ACTIVE = 10;
export const MAX_NAME = 30;
export const MIN_PASSWORD = 8;

/** Primeiro símbolo visível, preservando emojis compostos (ex.: 👩‍💻). */
export function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const [first] = new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(trimmed);
  return first.segment;
}

export function habitSymbol(habit: Pick<Habit, "name" | "emoji">): string {
  return habit.emoji || firstGrapheme(habit.name).toLocaleUpperCase("pt-BR");
}

export function habitNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Informe o nome do hábito.";
  if (trimmed.length > MAX_NAME) return `O nome pode ter no máximo ${MAX_NAME} caracteres.`;
  return null;
}

export function checkKey(habitId: number, day: string): string {
  return `${habitId}@${day}`;
}
