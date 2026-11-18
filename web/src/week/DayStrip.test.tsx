import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayStrip } from "./DayStrip";
import { visibleDays } from "./dates";

const today = "2026-10-28"; // quarta-feira

describe("DayStrip (spec 010)", () => {
  it("mostra segunda a domingo, com hoje em destaque forte", () => {
    const { container } = render(<DayStrip days={visibleDays(0, today)} today={today} />);

    // 1ª célula vazia sobre a coluna dos hábitos (rev. 3), depois segunda a domingo
    const cells = [...container.querySelectorAll(".grid > div")];
    expect(cells[0]).toHaveAttribute("aria-hidden", "true");
    expect(cells.slice(1).map((cell) => cell.textContent)).toEqual(["seg26", "ter27", "qua28", "qui29", "sex30", "sáb31", "dom01"]);

    const current = container.querySelectorAll('[aria-current="date"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("qua28");
    expect(current[0]).toHaveClass("bg-brand-600");
  });

  it("numa semana anterior nenhum dia fica em destaque", () => {
    const { container } = render(<DayStrip days={visibleDays(-1, today)} today={today} />);
    expect(container.querySelector('[aria-current="date"]')).toBeNull();
  });
});
