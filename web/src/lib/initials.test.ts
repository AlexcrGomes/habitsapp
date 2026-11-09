import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("usa uma letra para nome de uma palavra", () => {
    expect(initials("Ana")).toBe("A");
  });

  it("usa o primeiro e o último nome", () => {
    expect(initials("Ana Maria Souza")).toBe("AS");
  });

  it("mantém acentos e coloca em maiúscula", () => {
    expect(initials("érica lima")).toBe("ÉL");
  });

  it("ignora espaços extras", () => {
    expect(initials("  Ana   Souza  ")).toBe("AS");
  });

  it("devolve vazio para nome vazio", () => {
    expect(initials("   ")).toBe("");
  });
});
