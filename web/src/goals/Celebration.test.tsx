import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Habit } from "../api/types";
import { type ActiveCelebration, CELEBRATION_MS, Celebration, celebrationText } from "./Celebration";

const correr: Habit = { id: 1, name: "Correr", emoji: "🏃", archived: false, goal: 3, objective: "Pelo menos 5 km" };
const ler: Habit = { id: 2, name: "Ler", emoji: "📚", archived: false, goal: 2, objective: null };

function active(overrides: Partial<ActiveCelebration> = {}): ActiveCelebration {
  return { id: 1, kind: "habit", habit: correr, done: 3, goal: 3, lastWeek: false, ...overrides };
}

describe("textos da comemoração (spec 012)", () => {
  it("hábito, nesta semana e na passada, lembrando o objetivo", () => {
    expect(celebrationText(active())).toEqual({
      title: "Parabéns!",
      message: "Você bateu a meta de Correr nesta semana.",
      detail: "Pelo menos 5 km — 3 de 3 dias ✓",
    });
    expect(celebrationText(active({ lastWeek: true, habit: ler, done: 2, goal: 2 }))).toEqual({
      title: "Parabéns!",
      message: "Você bateu a meta de Ler na semana passada.",
      detail: null,
    });
    expect(celebrationText(active({ habit: { ...ler, objective: "Meditar" }, done: 1, goal: 1 })).detail).toBe("Meditar — 1 de 1 dia ✓");
  });

  it("semana perfeita, atual e passada", () => {
    expect(celebrationText(active({ kind: "week" }))).toEqual({
      title: "Semana perfeita!", message: "Você bateu todas as metas da semana.", detail: null,
    });
    expect(celebrationText(active({ kind: "week", lastWeek: true })).message).toBe("Você bateu todas as metas da semana passada.");
  });
});

describe("Celebration", () => {
  afterEach(() => vi.useRealTimers());

  function renderCelebration(celebration: ActiveCelebration | null) {
    const onClose = vi.fn();
    const view = render(<Celebration celebration={celebration} onClose={onClose} />);
    return { onClose, ...view };
  }

  it("região de status sempre presente, sem receber toques", () => {
    renderCelebration(null);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveClass("pointer-events-none");
  });

  it("mostra a mensagem e confete que some com reduzir movimento", () => {
    const { container } = renderCelebration(active());

    expect(screen.getByRole("status")).toHaveTextContent("Parabéns!Você bateu a meta de Correr nesta semana.");
    const pieces = container.querySelectorAll("[data-confetti]");
    expect(pieces).toHaveLength(24);
    expect(pieces[0]).toHaveClass("motion-safe:animate-confetti-fall");
    expect(pieces[0].parentElement).toHaveClass("motion-reduce:hidden");
    expect(pieces[0].parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("semana perfeita tem mais confete e o troféu", () => {
    const { container } = renderCelebration(active({ kind: "week" }));
    expect(container.querySelectorAll("[data-confetti]")).toHaveLength(48);
    expect(screen.getByRole("status")).toHaveTextContent("🏆Semana perfeita!");
  });

  it("fecha sozinha em 3,5 s", () => {
    vi.useFakeTimers();
    const { onClose } = renderCelebration(active());

    act(() => vi.advanceTimersByTime(CELEBRATION_MS - 1));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com Esc e com qualquer toque", () => {
    const { onClose } = renderCelebration(active());

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("uma comemoração nova substitui a anterior e reinicia o tempo", () => {
    vi.useFakeTimers();
    const { onClose, rerender } = renderCelebration(active());

    act(() => vi.advanceTimersByTime(3000));
    rerender(<Celebration celebration={active({ id: 2, habit: ler, done: 2, goal: 2 })} onClose={onClose} />);
    expect(screen.getByRole("status")).toHaveTextContent("Você bateu a meta de Ler nesta semana.");
    expect(screen.getByRole("status")).not.toHaveTextContent("Correr");
    act(() => vi.advanceTimersByTime(1000));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(CELEBRATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
