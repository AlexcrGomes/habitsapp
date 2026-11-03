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

    expect(onSave).toHaveBeenCalledWith("Ler", "", null);
  });

  it("envia a quantidade escolhida", async () => {
    const onSave = renderDialog(null);

    await userEvent.type(screen.getByLabelText("Nome"), "Correr");
    await userEvent.selectOptions(screen.getByLabelText("Meta semanal"), "3 dias por semana");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Correr", "", 3);
  });

  it("edição abre com a meta atual e permite remover", async () => {
    const onSave = renderDialog({ id: 7, name: "Correr", emoji: "🏃", archived: false, goal: 5 });

    expect(screen.getByLabelText("Meta semanal")).toHaveValue("5");
    await userEvent.selectOptions(screen.getByLabelText("Meta semanal"), "Sem meta");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith("Correr", "🏃", null);
  });
});
