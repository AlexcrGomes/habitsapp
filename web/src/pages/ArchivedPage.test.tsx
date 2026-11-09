import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Habit } from "@/api/types";
import { ArchivedPage } from "./ArchivedPage";

const correr: Habit = { id: 2, name: "Correr", emoji: "🏃", archived: true, goal: 3 };

function renderPage(props: Partial<Parameters<typeof ArchivedPage>[0]> = {}) {
  const onRestore = vi.fn(async () => {});
  const onDelete = vi.fn(async () => {});
  render(<ArchivedPage habits={[correr]} loaded limitReached={false} onRestore={onRestore} onDelete={onDelete} {...props} />);
  return { onRestore, onDelete };
}

describe("tela de arquivados", () => {
  it("lista os arquivados e restaura", async () => {
    const { onRestore } = renderPage();

    expect(screen.getByRole("heading", { name: "Hábitos arquivados" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restaurar Correr" }));

    expect(onRestore).toHaveBeenCalledWith(correr);
  });

  it("no limite de ativos, Restaurar fica desabilitado e explica o motivo", () => {
    renderPage({ limitReached: true });

    const restore = screen.getByRole("button", { name: "Restaurar Correr" });
    expect(restore).toBeDisabled();
    expect(restore).toHaveAccessibleDescription(/Limite de \d+ hábitos ativos atingido/);
  });

  it("excluir pede confirmação", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onDelete } = renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Excluir definitivamente Correr" }));

    expect(confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("sem arquivados mostra como arquivar", () => {
    renderPage({ habits: [] });

    expect(screen.getByText("Nenhum hábito arquivado")).toBeInTheDocument();
    expect(screen.getByText(/escolha "Arquivar"/)).toBeInTheDocument();
  });

  it("mostra o erro da API", async () => {
    const { ApiError } = await import("@/api/client");
    renderPage({ onRestore: vi.fn(async () => { throw new ApiError(409, "LIMIT", "Limite atingido."); }) });

    await userEvent.click(screen.getByRole("button", { name: "Restaurar Correr" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Limite atingido.");
  });
});
