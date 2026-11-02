import { describe, expect, it } from "vitest";
import { firstGrapheme, habitNameError, habitSymbol } from "./rules";

describe("regras de hábito", () => {
  it("valida o nome como a API", () => {
    expect(habitNameError("   ")).toBe("Informe o nome do hábito.");
    expect(habitNameError("x".repeat(31))).toBe("O nome pode ter no máximo 30 caracteres.");
    expect(habitNameError("  Ler  ")).toBeNull();
  });

  it("emoji composto conta como um símbolo", () => {
    expect(firstGrapheme("👩‍💻 extra")).toBe("👩‍💻");
    expect(firstGrapheme("  ")).toBe("");
  });

  it("sem emoji, usa a primeira letra do nome em maiúscula", () => {
    expect(habitSymbol({ name: "yoga", emoji: "" })).toBe("Y");
    expect(habitSymbol({ name: "yoga", emoji: "🧘" })).toBe("🧘");
  });
});
