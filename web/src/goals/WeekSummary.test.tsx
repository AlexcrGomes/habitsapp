import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Habit } from "../api/types";
import { HabitList } from "../habits/HabitList";
import { checkKey } from "../habits/rules";
import { visibleDays } from "../week/dates";
import { WeekSummary } from "./WeekSummary";

const today = "2026-10-28"; // quarta-feira
const habits: Habit[] = [
  { id: 1, name: "Correr", emoji: "🏃", archived: false, goal: 4 },
  { id: 2, name: "Ler", emoji: "📚", archived: false, goal: null },
];

describe("WeekSummary", () => {
  it("semana em andamento mostra percentual, frase e 'Até agora'", () => {
    const days = visibleDays("calendar", 0, today);
    const checks = new Set([checkKey(1, "2026-10-26"), checkKey(1, "2026-10-27"), checkKey(1, "2026-10-28")]);
    render(<WeekSummary habits={habits} checks={checks} goals={new Map([[1, 4]])} days={days} today={today} />);

    expect(screen.getByRole("heading", { name: "Resumo da semana · Até agora" })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Boa semana")).toBeInTheDocument();
  });

  it("semana passada não mostra 'Até agora'", () => {
    const days = visibleDays("calendar", -1, today);
    render(<WeekSummary habits={habits} checks={new Set()} goals={new Map([[1, 4]])} days={days} today={today} />);

    expect(screen.getByRole("heading", { name: "Resumo da semana" })).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Semana fraca")).toBeInTheDocument();
  });

  it("sem metas convida a definir", () => {
    render(<WeekSummary habits={habits} checks={new Set()} goals={new Map()}
      days={visibleDays("rolling", 0, today)} today={today} />);

    expect(screen.getByText("Defina metas nos hábitos para ver o resumo da semana.")).toBeInTheDocument();
  });
});

describe("barra da meta", () => {
  it("só hábitos com meta têm barra, limitada à meta e com texto acessível", () => {
    const days = visibleDays("rolling", 0, today);
    const checks = new Set(days.slice(0, 5).map((day) => checkKey(1, day)));
    render(<HabitList habits={habits} days={days} checks={checks} goals={new Map([[1, 4]])} archivedCount={0}
      onNew={() => {}} onEdit={() => {}} onOpenArchived={() => {}} onMove={() => {}} />);

    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAccessibleName("Meta de Correr");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "4");
    expect(bars[0]).toHaveAttribute("aria-valuetext", "Correr: 4 de 4 dias, meta atingida");
  });
});
