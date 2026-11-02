import { describe, expect, it } from "vitest";
import { addDays, formatDay, isEditable, lockReason, periodLabel, todayKey, visibleDays, weekdayShort } from "./dates";

describe("todayKey", () => {
  it("segue o horário de Brasília, não o UTC", () => {
    // 02:00 UTC de 01/11 ainda é 23:00 de 31/10 em Brasília
    expect(todayKey(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-31");
    expect(todayKey(new Date("2026-11-01T03:00:00Z"))).toBe("2026-11-01");
  });
});

describe("visibleDays", () => {
  const saturday = "2026-10-31";
  const wednesday = "2026-10-28";

  it("modo rolling: hoje e os 6 dias anteriores", () => {
    expect(visibleDays("rolling", 0, wednesday)).toEqual([
      "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28",
    ]);
  });

  it("modo calendar: domingo a sábado contendo hoje", () => {
    const days = visibleDays("calendar", 0, wednesday);
    expect(days[0]).toBe("2026-10-25");
    expect(days[6]).toBe("2026-10-31");
    expect(weekdayShort(days[0])).toBe("dom");
  });

  it("offset volta semanas inteiras", () => {
    expect(visibleDays("calendar", -1, saturday)[0]).toBe("2026-10-18");
    expect(visibleDays("rolling", -1, saturday).at(-1)).toBe("2026-10-24");
  });

  it("atravessa a virada do ano em ordem", () => {
    expect(visibleDays("calendar", 0, "2027-01-02")).toEqual([
      "2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02",
    ]);
  });
});

describe("janela editável", () => {
  const today = "2026-10-31";

  it("hoje e os 6 dias anteriores", () => {
    expect(isEditable(today, today)).toBe(true);
    expect(isEditable(addDays(today, -6), today)).toBe(true);
    expect(isEditable(addDays(today, -7), today)).toBe(false);
    expect(isEditable(addDays(today, 1), today)).toBe(false);
  });

  it("explica o motivo do bloqueio", () => {
    expect(lockReason(addDays(today, 1), today)).toBe(" (dia futuro)");
    expect(lockReason(addDays(today, -7), today)).toBe(" (somente consulta)");
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
