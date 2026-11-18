import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { checkKey } from "../habits/rules";
import { visibleDays } from "./dates";
import { WeekGrid } from "./WeekGrid";

describe("WeekGrid", () => {
  const today = "2026-10-28"; // quarta-feira
  const habits = [{ id: 1, name: "Ler", emoji: "📚", archived: false, goal: null }];

  it("bloqueia dias futuros e mostra hoje destacado", () => {
    render(<WeekGrid days={visibleDays(0, today)} today={today} habits={habits}
      checks={new Set([checkKey(1, "2026-10-26")])} onToggle={() => {}} />);

    expect(screen.getByRole("checkbox", { name: "Ler em 28/10" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 26/10" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ler em 29/10 (dia futuro)" })).toBeDisabled();
    expect(document.querySelector(".day.today")).toHaveAttribute("aria-current", "date");
  });

  it("semana anterior inteira editável; antes dela, só consulta (spec 010, rev. 3)", () => {
    const { unmount } = render(<WeekGrid days={visibleDays(-1, today)} today={today} habits={habits}
      checks={new Set()} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Ler em 19/10" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 25/10" })).toBeEnabled();
    unmount();

    render(<WeekGrid days={visibleDays(-2, today)} today={today} habits={habits}
      checks={new Set()} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Ler em 18/10 (somente consulta)" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 12/10 (somente consulta)" })).toBeDisabled();
  });

  it("marcar avisa o hábito e o dia", async () => {
    const onToggle = vi.fn();
    render(<WeekGrid days={visibleDays(0, today)} today={today} habits={habits}
      checks={new Set()} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Ler em 27/10" }));
    expect(onToggle).toHaveBeenCalledWith(1, "2026-10-27", true);
  });

  it("só a caixa recém-marcada anima o encaixe (spec 009, US5)", async () => {
    const days = visibleDays(0, today);
    const props = { days, today, habits, onToggle: () => {} };
    const { rerender } = render(<WeekGrid {...props} checks={new Set([checkKey(1, "2026-10-26")])} />);

    const loaded = screen.getByRole("checkbox", { name: "Ler em 26/10" });
    const clicked = screen.getByRole("checkbox", { name: "Ler em 27/10" });
    expect(loaded.className).not.toContain("animate-block-in");

    await userEvent.click(clicked);
    rerender(<WeekGrid {...props} checks={new Set([checkKey(1, "2026-10-26"), checkKey(1, "2026-10-27")])} />);
    expect(clicked.className).toContain("motion-safe:animate-block-in");
    expect(loaded.className).not.toContain("animate-block-in");
  });
});
