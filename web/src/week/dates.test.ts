import { describe, expect, it } from "vitest";
import { addDays, formatDay, isEditable, lockReason, periodLabel, todayKey, visibleDays, weekStart, weekdayShort } from "./dates";

describe("todayKey", () => {
  it("segue o horário de Brasília, não o UTC", () => {
    // 02:00 UTC de 01/11 ainda é 23:00 de 31/10 em Brasília
    expect(todayKey(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-31");
    expect(todayKey(new Date("2026-11-01T03:00:00Z"))).toBe("2026-11-01");
  });
});

describe("visibleDays (segunda a domingo, spec 010)", () => {
  const monday = "2026-10-26";
  const wednesday = "2026-10-28";
  const saturday = "2026-10-31";
  const sunday = "2026-11-01";

  it("semana de segunda a domingo contendo hoje", () => {
    expect(visibleDays(0, wednesday)).toEqual([
      "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01",
    ]);
    const days = visibleDays(0, wednesday);
    expect(weekdayShort(days[0])).toBe("seg");
    expect(weekdayShort(days[6])).toBe("dom");
  });

  it("numa segunda a semana começa hoje; num domingo, termina hoje", () => {
    expect(visibleDays(0, monday)[0]).toBe(monday);
    expect(visibleDays(0, sunday)[0]).toBe(monday);
    expect(visibleDays(0, sunday)[6]).toBe(sunday);
  });

  it("offset volta semanas inteiras", () => {
    expect(visibleDays(-1, saturday)).toEqual([
      "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25",
    ]);
  });

  it("atravessa a virada do ano em ordem", () => {
    expect(visibleDays(0, "2027-01-02")).toEqual([
      "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
    ]);
  });
});

describe("janela editável (spec 010, revisão 3)", () => {
  const today = "2026-10-31"; // sábado; semana de 26/10

  it("da segunda-feira da semana anterior até hoje", () => {
    expect(isEditable(today, today)).toBe(true);
    expect(isEditable("2026-10-19", today)).toBe(true); // segunda da semana anterior
    expect(isEditable("2026-10-18", today)).toBe(false);
    expect(isEditable(addDays(today, 1), today)).toBe(false);
  });

  it("numa segunda, a semana anterior inteira continua editável", () => {
    const monday = "2026-11-02";
    expect(weekStart(monday)).toBe(monday);
    expect(isEditable("2026-10-26", monday)).toBe(true);
    expect(isEditable("2026-10-25", monday)).toBe(false);
  });

  it("num domingo, são 14 dias editáveis", () => {
    const sunday = "2026-11-01";
    expect(weekStart(sunday)).toBe("2026-10-26");
    expect(isEditable("2026-10-19", sunday)).toBe(true);
    expect(isEditable("2026-10-18", sunday)).toBe(false);
  });

  it("explica o motivo do bloqueio", () => {
    expect(lockReason(addDays(today, 1), today)).toBe(" (dia futuro)");
    expect(lockReason("2026-10-18", today)).toBe(" (somente consulta)");
    expect(lockReason(today, today)).toBe("");
  });
});

describe("formatação", () => {
  it("DD/MM, dia da semana sem ponto e período", () => {
    expect(formatDay("2026-10-31")).toBe("31/10");
    expect(weekdayShort("2026-10-30")).toBe("sex");
    expect(periodLabel(["2026-10-25", "2026-10-31"])).toBe("25/10 – 31/10");
  });
});
