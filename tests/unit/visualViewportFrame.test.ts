import { describe, expect, it } from "vitest";
import { visualViewportFrame } from "../../src/react-app/app/shell/visualViewportFrame";

describe("visualViewportFrame", () => {
  it("uses visualHeight when positive", () => {
    expect(visualViewportFrame(800, 900, 0)).toEqual({
      heightPx: 800,
      resetScroll: false,
    });
  });

  it("falls back to innerHeight when visualHeight is null or non-positive", () => {
    expect(visualViewportFrame(null, 900, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
    });
    expect(visualViewportFrame(0, 900, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
    });
    expect(visualViewportFrame(-1, 900, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
    });
  });

  it("requests scroll reset when scrollY is not zero", () => {
    expect(visualViewportFrame(800, 900, 0).resetScroll).toBe(false);
    expect(visualViewportFrame(800, 900, 12).resetScroll).toBe(true);
    expect(visualViewportFrame(null, 900, 1).resetScroll).toBe(true);
  });
});
