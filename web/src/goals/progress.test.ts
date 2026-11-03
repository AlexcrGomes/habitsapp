import { describe, expect, it } from "vitest";
import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";
import { visibleDays } from "../week/dates";
import { doneCount, habitProgress, summaryLabel, weekSummary } from "./progress";

const days = visibleDays("rolling", 0, "2026-10-31");

function habit(id: number): Habit {
  return { id, name: `Hábito ${id}`, emoji: "", archived: false, goal: null };
}

function checksFor(habitId: number, count: number): string[] {
  return days.slice(0, count).map((day) => checkKey(habitId, day));
}

describe("metas semanais", () => {
  it("conta só os dias da semana exibida", () => {
    const checks = new Set([...checksFor(1, 2), checkKey(1, "2026-10-01")]);
    expect(doneCount(1, days, checks)).toBe(2);
  });

  it("progresso da meta é limitado a 100%", () => {
    expect(habitProgress(2, 4)).toBe(0.5);
    expect(habitProgress(6, 4)).toBe(1);
    expect(habitProgress(0, 3)).toBe(0);
  });

  it("frases pelas faixas 100/70/40", () => {
    expect(summaryLabel(100)).toBe("Semana perfeita");
    expect(summaryLabel(99)).toBe("Boa semana");
    expect(summaryLabel(70)).toBe("Boa semana");
    expect(summaryLabel(69)).toBe("Dá para melhorar");
    expect(summaryLabel(40)).toBe("Dá para melhorar");
    expect(summaryLabel(39)).toBe("Semana fraca");
    expect(summaryLabel(0)).toBe("Semana fraca");
  });

  it("geral = cumprido (limitado por meta) ÷ soma das metas", () => {
    // Spec 006, cenário 3.3: meta 4 com 2 feitos e meta 2 com 3 feitos → (2 + 2) ÷ 6
    const checks = new Set([...checksFor(1, 2), ...checksFor(2, 3)]);
    const goals = new Map([[1, 4], [2, 2]]);
    expect(weekSummary([habit(1), habit(2)], checks, goals, days)).toEqual({ percent: 67, label: "Dá para melhorar" });
  });

  it("hábitos sem meta não entram; sem nenhuma meta não há resumo", () => {
    const checks = new Set([...checksFor(1, 3), ...checksFor(2, 7)]);
    expect(weekSummary([habit(1), habit(2)], checks, new Map([[1, 3]]), days)).toEqual({ percent: 100, label: "Semana perfeita" });
    expect(weekSummary([habit(1), habit(2)], checks, new Map(), days)).toBeNull();
    // Meta de hábito que não está na lista (ex.: arquivado) é ignorada
    expect(weekSummary([habit(2)], checks, new Map([[1, 3]]), days)).toBeNull();
  });

  it("só é perfeita quando todas as metas foram cumpridas", () => {
    // 199 de 200 = 99,5% → não arredonda para 100
    const habits = Array.from({ length: 40 }, (_, index) => habit(index + 1));
    const goals = new Map(habits.map((item) => [item.id, 5]));
    const checks = new Set(habits.flatMap((item) => checksFor(item.id, item.id === 1 ? 4 : 5)));
    expect(weekSummary(habits, checks, goals, days)).toEqual({ percent: 99, label: "Boa semana" });
  });
});
