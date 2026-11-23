import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Habit } from "@/api/types";
import { checkKey } from "@/habits/rules";
import { MOBILE_QUERY, SHORT_QUERY } from "@/lib/useMobileLayout";
import { visibleDays } from "@/week/dates";
import { WeekPage } from "./WeekPage";

const today = "2026-10-28"; // quarta-feira
const habits: Habit[] = [
  { id: 1, name: "Ler", emoji: "📚", archived: false, goal: 4, objective: null },
  { id: 2, name: "Correr", emoji: "🏃", archived: false, goal: null, objective: null },
];

function renderWeek() {
  const props = {
    days: visibleDays(0, today),
    today,
    offset: 0,
    habits,
    checks: new Set([checkKey(1, "2026-10-27")]),
    goals: new Map([[1, 4]]),
    loaded: true,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onToggle: vi.fn(),
    onMove: vi.fn(),
    onEdit: vi.fn(),
  };
  return { props, ...render(<WeekPage {...props} />) };
}

/** Simula a tela: celular (em pé ou deitado) ou computador. */
function simulateScreen(kind: "phone" | "landscape" | "desktop") {
  const matches: Record<string, boolean> = {
    [MOBILE_QUERY]: kind !== "desktop",
    [SHORT_QUERY]: kind === "landscape",
  };
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: matches[query] ?? false, addEventListener: () => {}, removeEventListener: () => {},
  })));
}

describe("WeekPage (spec 010)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no celular usa a lista empilhada, sem nada duplicado", async () => {
    simulateScreen("phone");
    const { props, container } = renderWeek();

    expect(container.querySelector(".days")).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(14);
    expect(screen.getAllByRole("button", { name: "Editar Ler" })).toHaveLength(1);
    expect(screen.getAllByRole("progressbar", { name: "Meta de Ler" })).toHaveLength(1);

    // Resumo e navegação entre semanas continuam na tela
    expect(screen.getByRole("region", { name: /Resumo da semana/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
    expect(props.onPrevious).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("checkbox", { name: "Correr em 28/10" }));
    expect(props.onToggle).toHaveBeenCalledWith(2, "2026-10-28", true);
  });

  it("não existe mais a escolha de modo da semana (revisão 2)", () => {
    simulateScreen("desktop");
    renderWeek();
    expect(screen.queryByText("Últimos 7 dias")).toBeNull();
    expect(screen.queryByText("Dom–Sáb")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it.each(["phone", "desktop"] as const)("título e, logo embaixo, a semana (%s)", (kind) => {
    simulateScreen(kind);
    renderWeek();
    const title = screen.getByRole("heading", { level: 1, name: "Semana" });
    const nav = screen.getByRole("navigation", { name: "Navegação entre semanas" });
    expect(title.nextElementSibling).toBe(nav);
    expect(nav).toHaveTextContent("26/10 – 01/11");
  });

  it("celular em pé: título, semana, resumo e faixa de dias no topo fixo; hábitos fora dele", () => {
    simulateScreen("phone");
    const { container } = renderWeek();
    const top = container.querySelector<HTMLElement>("[data-week-top]")!;

    expect(top).toHaveClass("sticky");
    expect(within(top).getByRole("heading", { name: "Semana" })).toBeInTheDocument();
    expect(within(top).getByRole("navigation", { name: "Navegação entre semanas" })).toBeInTheDocument();
    expect(within(top).getByRole("region", { name: /Resumo da semana/ })).toBeInTheDocument();
    expect(top.querySelector('[aria-current="date"]')).toHaveTextContent("qua28");
    expect(within(top).queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("celular deitado: o topo rola e só a faixa de dias fica fixa", () => {
    simulateScreen("landscape");
    const { container } = renderWeek();
    const top = container.querySelector<HTMLElement>("[data-week-top]")!;

    expect(top).not.toHaveClass("sticky");
    expect(top.querySelector('[aria-current="date"]')).toBeNull();
    expect(container.querySelector('[aria-current="date"]')!.closest(".sticky")).not.toBeNull();
  });

  it("fora do celular continua com a lista + grade da spec 009", () => {
    simulateScreen("desktop");
    const { container } = renderWeek();

    expect(container.querySelector(".days")).not.toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(14);
    expect(screen.getAllByRole("button", { name: "Editar Ler" })).toHaveLength(1);
  });

  it("no computador, o objetivo aparece abaixo do nome e descreve o botão de editar (spec 012)", () => {
    simulateScreen("desktop");
    render(<WeekPage days={visibleDays(0, today)} today={today} offset={0} loaded checks={new Set()} goals={new Map([[1, 4]])}
      habits={[{ ...habits[0], objective: "Ler pelo menos 10 páginas" }, habits[1]]}
      onPrevious={vi.fn()} onNext={vi.fn()} onToggle={vi.fn()} onMove={vi.fn()} onEdit={vi.fn()} />);

    const line = screen.getByTitle("Ler pelo menos 10 páginas");
    expect(line).toHaveClass("truncate", "text-xs");
    expect(screen.getByRole("button", { name: "Editar Ler" })).toHaveAccessibleDescription("Objetivo: Ler pelo menos 10 páginas");
    expect(screen.getByRole("button", { name: "Editar Correr" })).not.toHaveAttribute("aria-describedby");
  });
});
