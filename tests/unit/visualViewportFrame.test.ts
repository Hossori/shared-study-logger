import { describe, expect, it } from "vitest";
import { visualViewportFrame } from "../../src/react-app/app/shell/visualViewportFrame";

describe("visualViewportFrame", () => {
  it("uses visualHeight when positive", () => {
    expect(visualViewportFrame(800, 900, 0, 0)).toEqual({
      heightPx: 800,
      resetScroll: false,
      translateY: 0,
    });
  });

  it("falls back to innerHeight when visualHeight is null or non-positive", () => {
    expect(visualViewportFrame(null, 900, 0, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
      translateY: 0,
    });
    expect(visualViewportFrame(0, 900, 0, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
      translateY: 0,
    });
    expect(visualViewportFrame(-1, 900, 0, 0)).toEqual({
      heightPx: 900,
      resetScroll: false,
      translateY: 0,
    });
  });

  it("requests scroll reset when scrollY is not zero", () => {
    expect(visualViewportFrame(800, 900, 0, 0).resetScroll).toBe(false);
    expect(visualViewportFrame(800, 900, 12, 0).resetScroll).toBe(true);
    expect(visualViewportFrame(null, 900, 1, 0).resetScroll).toBe(true);
  });

  it("uses offsetTop as translateY when positive, else 0", () => {
    expect(visualViewportFrame(800, 900, 0, 24).translateY).toBe(24);
    expect(visualViewportFrame(800, 900, 0, 0).translateY).toBe(0);
    expect(visualViewportFrame(800, 900, 0, -5).translateY).toBe(0);
  });
});
