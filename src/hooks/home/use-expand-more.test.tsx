import { describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { useExpandMore } from "./use-expand-more";

describe("useExpandMore", () => {
  it("starts at the initial limit and raises it once to the maximum", () => {
    const { result } = renderHook(() =>
      useExpandMore({ initialLimit: 8, maxLimit: 24 }),
    );
    expect(result.current.limit).toBe(8);
    expect(result.current.isExpanded).toBe(false);

    act(() => result.current.expand());
    expect(result.current.limit).toBe(24);
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.expand());
    expect(result.current.limit).toBe(24);
  });
});
