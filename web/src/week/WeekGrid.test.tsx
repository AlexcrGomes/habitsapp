import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { checkKey } from "../habits/rules";
import { visibleDays } from "./dates";
import { WeekGrid } from "./WeekGrid";

describe("WeekGrid", () => {
  const today = "2026-10-28"; // quarta-feira
  const habits = [{ id: 1, name: "Ler", emoji: "📚", archived: false }];

  it("bloqueia dias futuros e mostra hoje destacado (modo Dom–Sáb)", () => {
    render(<WeekGrid days={visibleDays("calendar", 0, today)} today={today} habits={habits}
      checks={new Set([checkKey(1, "2026-10-26")])} onToggle={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "Ler em 28/10" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 26/10" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ler em 29/10 (dia futuro)" })).toBeDisabled();
    expect(document.querySelector(".day.today")).toHaveAttribute("aria-current", "date");
  });

  it("dias antigos ficam só para consulta", () => {
    render(<WeekGrid days={visibleDays("calendar", -1, today)} today={today} habits={habits}
      checks={new Set()} onToggle={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "Ler em 21/10 (somente consulta)" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 22/10" })).toBeEnabled();
  });

  it("marcar avisa o hábito e o dia", async () => {
    const onToggle = vi.fn();
    render(<WeekGrid days={visibleDays("rolling", 0, today)} today={today} habits={habits}
      checks={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Ler em 25/10" }));
    expect(onToggle).toHaveBeenCalledWith(1, "2026-10-25", true);
  });
});
