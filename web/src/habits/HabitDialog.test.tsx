import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HabitDialog } from "./HabitDialog";

function renderDialog(habit: Parameters<typeof HabitDialog>[0]["habit"]) {
  const onSave = vi.fn(async () => {});
  render(<HabitDialog open habit={habit} onClose={() => {}} onSave={onSave}
    onRestore={async () => {}} onArchive={async () => {}} />);
  return onSave;
}

describe("meta semanal no diálogo", () => {
  it("novo hábito começa sem meta e envia null", async () => {
    const onSave = renderDialog(null);

    expect(screen.getByLabelText("Meta semanal")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Nome"), "Ler");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Ler", "", null, "");
  });

  it("envia a quantidade escolhida", async () => {
    const onSave = renderDialog(null);

    await userEvent.type(screen.getByLabelText("Nome"), "Correr");
    await userEvent.selectOptions(screen.getByLabelText("Meta semanal"), "3 dias por semana");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Correr", "", 3, "");
  });

  it("edição abre com a meta atual e permite remover", async () => {
    const onSave = renderDialog({ id: 7, name: "Correr", emoji: "🏃", archived: false, goal: 5, objective: null });

    expect(screen.getByLabelText("Meta semanal")).toHaveValue("5");
    await userEvent.selectOptions(screen.getByLabelText("Meta semanal"), "Sem meta");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Correr", "🏃", null, "");
  });
});

describe("objetivo no diálogo (spec 012)", () => {
  it("novo hábito começa sem objetivo e envia o texto aparado", async () => {
    const onSave = renderDialog(null);

    expect(screen.getByLabelText("Objetivo (opcional)")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Nome"), "Ler");
    await userEvent.type(screen.getByLabelText("Objetivo (opcional)"), "  Ler pelo menos 10 páginas ");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Ler", "", null, "Ler pelo menos 10 páginas");
  });

  it("edição abre com o objetivo atual e permite apagar", async () => {
    const onSave = renderDialog({ id: 3, name: "Correr", emoji: "", archived: false, goal: null, objective: "Pelo menos 5 km" });

    expect(screen.getByLabelText("Objetivo (opcional)")).toHaveValue("Pelo menos 5 km");
    expect(screen.getByText("15/60")).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Objetivo (opcional)"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Correr", "", null, "");
  });

  it("não passa de 60 caracteres e mostra o contador", async () => {
    renderDialog(null);
    const field = screen.getByLabelText("Objetivo (opcional)");

    await userEvent.type(field, "x".repeat(65));

    expect(field).toHaveValue("x".repeat(60));
    expect(screen.getByText("60/60")).toBeInTheDocument();
  });
});
