import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Link, navigate, useRoute } from "./router";

function Probe() {
  const route = useRoute();
  return (
    <>
      <p data-testid="rota">{route}</p>
      <nav>
        <Link to="/">Semana</Link>
        <Link to="/arquivados">Arquivados</Link>
      </nav>
    </>
  );
}

describe("roteador", () => {
  it("navigate muda a rota e o endereço", () => {
    render(<Probe />);
    expect(screen.getByTestId("rota")).toHaveTextContent("/");

    act(() => navigate("/arquivados"));

    expect(screen.getByTestId("rota")).toHaveTextContent("/arquivados");
    expect(window.location.pathname).toBe("/arquivados");
  });

  it("o botão voltar do navegador volta à rota anterior", async () => {
    render(<Probe />);
    act(() => navigate("/conta"));
    expect(screen.getByTestId("rota")).toHaveTextContent("/conta");

    act(() => window.history.back());

    await waitFor(() => expect(screen.getByTestId("rota")).toHaveTextContent(/^\/$/));
  });

  it("caminho desconhecido vale como a Semana", () => {
    window.history.replaceState(null, "", "/xyz");
    render(<Probe />);
    expect(screen.getByTestId("rota")).toHaveTextContent(/^\/$/);
  });

  it("Link navega sem recarregar e marca o destino atual", async () => {
    render(<Probe />);
    expect(screen.getByRole("link", { name: "Semana" })).toHaveAttribute("aria-current", "page");

    await userEvent.click(screen.getByRole("link", { name: "Arquivados" }));

    expect(screen.getByTestId("rota")).toHaveTextContent("/arquivados");
    expect(screen.getByRole("link", { name: "Arquivados" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Semana" })).not.toHaveAttribute("aria-current");
  });
});
