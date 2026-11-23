import { describe, expect, it } from "vitest";
import type { Habit } from "../api/types";
import { checkKey } from "../habits/rules";
import { visibleDays } from "../week/dates";
import { celebrationFor } from "./celebrationRules";

const days = visibleDays(0, "2026-10-28"); // 26/10 (segunda) a 01/11
const correr: Habit = { id: 1, name: "Correr", emoji: "🏃", archived: false, goal: 3, objective: "Pelo menos 5 km" };
const ler: Habit = { id: 2, name: "Ler", emoji: "📚", archived: false, goal: 2, objective: null };
const meditar: Habit = { id: 3, name: "Meditar", emoji: "", archived: false, goal: null, objective: null };
const habits = [correr, ler, meditar];

function checks(...entries: [number, string][]): Set<string> {
  return new Set(entries.map(([id, day]) => checkKey(id, day)));
}

describe("celebrationFor (spec 012)", () => {
  const goals = new Map([[1, 3], [2, 2]]);
  const twoRuns = checks([1, "2026-10-26"], [1, "2026-10-27"]);

  it("comemora o hábito quando a marcação cruza a meta", () => {
    expect(celebrationFor(habits, twoRuns, goals, days, 1, "2026-10-28", true))
      .toEqual({ kind: "habit", habit: correr, done: 3, goal: 3 });
  });

  it("não comemora antes da meta, além dela, ao desmarcar ou sem meta", () => {
    const oneRun = checks([1, "2026-10-26"]);
    const threeRuns = checks([1, "2026-10-26"], [1, "2026-10-27"], [1, "2026-10-28"]);

    expect(celebrationFor(habits, oneRun, goals, days, 1, "2026-10-27", true)).toBeNull();
    expect(celebrationFor(habits, threeRuns, goals, days, 1, "2026-10-29", true)).toBeNull();
    expect(celebrationFor(habits, twoRuns, goals, days, 1, "2026-10-27", false)).toBeNull();
    expect(celebrationFor(habits, new Set(), goals, days, 3, "2026-10-26", true)).toBeNull();
  });

  it("dia já marcado não comemora de novo", () => {
    const threeRuns = checks([1, "2026-10-26"], [1, "2026-10-27"], [1, "2026-10-28"]);
    expect(celebrationFor(habits, threeRuns, goals, days, 1, "2026-10-28", true)).toBeNull();
  });

  it("desmarcar e marcar de novo volta a comemorar", () => {
    // Depois de desmarcar, as marcações voltam a 2 de 3
    expect(celebrationFor(habits, twoRuns, goals, days, 1, "2026-10-26", true)).toBeNull(); // já marcado
    expect(celebrationFor(habits, twoRuns, goals, days, 1, "2026-10-30", true)?.kind).toBe("habit");
  });

  it("a última meta da semana dá só a comemoração da semana perfeita", () => {
    const allButOne = checks([1, "2026-10-26"], [1, "2026-10-27"], [1, "2026-10-28"], [2, "2026-10-26"]);
    expect(celebrationFor(habits, allButOne, goals, days, 2, "2026-10-27", true))
      .toEqual({ kind: "week", habit: ler, done: 2, goal: 2 });
  });

  it("um único hábito com meta: bater a meta é a semana perfeita", () => {
    expect(celebrationFor(habits, twoRuns, new Map([[1, 3]]), days, 1, "2026-10-28", true)?.kind).toBe("week");
  });

  it("semana já em 100%: marcar mais não comemora", () => {
    const perfect = checks([1, "2026-10-26"], [1, "2026-10-27"], [1, "2026-10-28"], [2, "2026-10-26"], [2, "2026-10-27"]);
    expect(celebrationFor(habits, perfect, goals, days, 1, "2026-10-29", true)).toBeNull();
    expect(celebrationFor(habits, perfect, goals, days, 2, "2026-10-28", true)).toBeNull();
  });

  it("marcação fora da semana exibida não conta", () => {
    expect(celebrationFor(habits, twoRuns, goals, days, 1, "2026-11-05", true)).toBeNull();
  });
});
