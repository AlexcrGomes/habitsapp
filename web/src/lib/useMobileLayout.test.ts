import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOBILE_QUERY, SHORT_QUERY, useMediaQuery, useMobileLayout } from "./useMobileLayout";

/** matchMedia falso: guarda os ouvintes para simular a troca (girar o celular). */
function mockMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const list = {
    matches: initial,
    media: MOBILE_QUERY,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => list));
  return {
    change(matches: boolean) {
      list.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("useMobileLayout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sem matchMedia (jsdom) usa o layout de desktop", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(renderHook(() => useMobileLayout()).result.current).toBe(false);
  });

  it("tela de celular usa o layout de celular", () => {
    mockMatchMedia(true);
    expect(renderHook(() => useMobileLayout()).result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(MOBILE_QUERY);
  });

  it("useMediaQuery consulta a query pedida", () => {
    mockMatchMedia(true);
    expect(renderHook(() => useMediaQuery(SHORT_QUERY)).result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(SHORT_QUERY);
  });

  it("acompanha a troca de tamanho da tela", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current).toBe(false);

    act(() => media.change(true));
    expect(result.current).toBe(true);

    act(() => media.change(false));
    expect(result.current).toBe(false);
  });
});
