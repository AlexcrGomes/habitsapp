import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Habit } from "../api/types";
import { visibleDays } from "../week/dates";
import { HabitRows } from "./HabitRows";
import { checkKey } from "./rules";

const today = "2026-10-28"; // quarta-feira
const habits: Habit[] = [
  { id: 1, name: "Ler", emoji: "📚", archived: false, goal: 4 },
  { id: 2, name: "Correr", emoji: "🏃", archived: false, goal: null },
];

function renderRows(overrides: Partial<Parameters<typeof HabitRows>[0]> = {}) {
  const props = {
    habits,
    days: visibleDays(0, today),
    today,
    checks: new Set<string>(),
    goals: new Map([[1, 4]]),
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onMove: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<HabitRows {...props} />) };
}

describe("HabitRows (Semana no celular, spec 010)", () => {
  it("em cada hábito, o nome vem antes das 7 marcações", () => {
    renderRows();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    rows.forEach((row, index) => {
      const name = within(row).getByText(habits[index].name);
      const boxes = within(row).getAllByRole("checkbox");
      expect(boxes).toHaveLength(7);
      // O nome precede todas as caixas na ordem do documento
      boxes.forEach((box) => expect(name.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
    });
  });

  it("nomes acessíveis iguais aos do desktop e dias bloqueados", () => {
    renderRows({ checks: new Set([checkKey(1, "2026-10-26")]) });

    expect(screen.getByRole("checkbox", { name: "Ler em 28/10" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Ler em 26/10" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ler em 29/10 (dia futuro)" })).toBeDisabled();
  });

  it("semana anterior inteira editável; antes dela, só consulta (rev. 3)", () => {
    const { unmount } = renderRows({ days: visibleDays(-1, today) });
    expect(screen.getByRole("checkbox", { name: "Correr em 19/10" })).toBeEnabled();
    unmount();

    renderRows({ days: visibleDays(-2, today) });
    expect(screen.getByRole("checkbox", { name: "Correr em 18/10 (somente consulta)" })).toBeDisabled();
  });

  it("tocar na caixa ou na célula marca o dia", async () => {
    const { props } = renderRows();

    await userEvent.click(screen.getByRole("checkbox", { name: "Ler em 27/10" }));
    expect(props.onToggle).toHaveBeenCalledWith(1, "2026-10-27", true);

    const cell = screen.getByRole("checkbox", { name: "Correr em 26/10" }).closest("label")!;
    await userEvent.click(cell);
    expect(props.onToggle).toHaveBeenCalledWith(2, "2026-10-26", true);
  });

  it("só a caixa recém-marcada anima o encaixe", async () => {
    const days = visibleDays(0, today);
    const { props, rerender } = renderRows({ days, checks: new Set([checkKey(1, "2026-10-26")]) });

    const loaded = screen.getByRole("checkbox", { name: "Ler em 26/10" });
    const clicked = screen.getByRole("checkbox", { name: "Ler em 27/10" });
    await userEvent.click(clicked);
    rerender(<HabitRows {...props} days={days} checks={new Set([checkKey(1, "2026-10-26"), checkKey(1, "2026-10-27")])} />);

    expect(clicked.className).toContain("motion-safe:animate-block-in");
    expect(loaded.className).not.toContain("animate-block-in");
  });

  it("coluna de hoje contínua atrás de todos os hábitos (revisão 2)", () => {
    const { container } = renderRows();

    // Quarta é a 3ª coluna da semana de segunda a domingo
    const column = container.querySelector<HTMLElement>("[data-today-column]")!;
    expect(column).toHaveAttribute("aria-hidden", "true");
    // Depois da coluna dos hábitos (5.25rem), 2 colunas de dia
    // (o jsdom simplifica o calc: 2/7 = 0,2857…)
    expect(column.style.left).toContain("5.25rem");
    expect(column.style.left).toContain("0.2857");
    // As caixas de hoje mantêm a marca para a borda azul
    expect(container.querySelectorAll("label[data-today]")).toHaveLength(habits.length);
    // Sem .days: nada para o scrollToToday rolar
    expect(container.querySelector(".days")).toBeNull();
  });

  it("numa semana sem hoje não há coluna destacada", () => {
    const { container } = renderRows({ days: visibleDays(-1, today) });
    expect(container.querySelector("[data-today-column]")).toBeNull();
    expect(container.querySelector("label[data-today]")).toBeNull();
  });

  it("mostra o progresso da meta e edita pelo lápis", async () => {
    const { props } = renderRows({ checks: new Set([checkKey(1, "2026-10-26")]) });

    expect(screen.getByRole("progressbar", { name: "Meta de Ler" })).toHaveAttribute("aria-valuetext", "Ler: 1 de 4 dias");
    await userEvent.click(screen.getByRole("button", { name: "Editar Correr" }));
    expect(props.onEdit).toHaveBeenCalledWith(habits[1]);
  });

  it("↑/↓ ficam fora da vista, mas funcionam pelo teclado e mantêm o foco (US4)", async () => {
    const { props, rerender, container } = renderRows();

    // Fora da vista até receberem foco
    container.querySelectorAll(".habit-move").forEach((move) => expect(move).toHaveClass("not-focus-within:sr-only"));
    expect(screen.getByRole("button", { name: "Mover Ler para cima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover Correr para baixo" })).toBeDisabled();

    const down = screen.getByRole("button", { name: "Mover Ler para baixo" });
    down.focus();
    await userEvent.keyboard("{Enter}");
    expect(props.onMove).toHaveBeenCalledWith(1, 1);

    // Ler virou o último: "para baixo" fica desabilitado e o foco passa para "para cima"
    rerender(<HabitRows {...props} habits={[habits[1], habits[0]]} />);
    expect(screen.getByRole("button", { name: "Mover Ler para baixo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mover Ler para cima" })).toHaveFocus();
  });

  it("tocar no nome ou no emoji abre a edição; sem lápis à vista (rev. 3)", async () => {
    const { props, container } = renderRows();

    await userEvent.click(screen.getByText("Ler"));
    expect(props.onEdit).toHaveBeenCalledWith(habits[0]);
    // O botão de edição é o próprio hábito (emoji + selo + nome); não há ícone de lápis
    const edit = screen.getByRole("button", { name: "Editar Ler" });
    expect(edit).toHaveTextContent("📚");
    expect(edit).toHaveTextContent("0/4");
    expect(container.querySelector("svg.lucide-pencil")).toBeNull();
  });

  it("caixas de 28px e uma linha por hábito: 1ª coluna + 7 dias", () => {
    const { container } = renderRows();
    const row = container.querySelector("li.habit")!;
    expect(row.children).toHaveLength(8);
    expect(row.querySelector("input")).toHaveClass("size-7");
  });

  it("sem hábitos mostra o convite", () => {
    renderRows({ habits: [] });
    expect(screen.getByText("Crie seu primeiro hábito")).toBeInTheDocument();
  });
});
