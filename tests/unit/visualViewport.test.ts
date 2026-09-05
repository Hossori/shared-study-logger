import { describe, expect, it } from "vitest";
import { getVisualViewportFrame } from "../../src/react-app/lib/visualViewport";

describe("getVisualViewportFrame", () => {
  it("returns layout viewport when visualViewport is missing", () => {
    expect(
      getVisualViewportFrame({ innerHeight: 800, innerWidth: 390 }, null),
    ).toEqual({
      top: 0,
      left: 0,
      height: 800,
      width: 390,
      keyboardInset: 0,
    });
  });

  it("computes keyboard inset from shrunk visual viewport", () => {
    expect(
      getVisualViewportFrame(
        { innerHeight: 800, innerWidth: 390 },
        { offsetTop: 0, offsetLeft: 0, height: 500, width: 390 },
      ),
    ).toEqual({
      top: 0,
      left: 0,
      height: 500,
      width: 390,
      keyboardInset: 300,
    });
  });

  it("handles iOS-style pan with positive offsetTop", () => {
    expect(
      getVisualViewportFrame(
        { innerHeight: 800, innerWidth: 390 },
        { offsetTop: 100, offsetLeft: 0, height: 500, width: 390 },
      ),
    ).toEqual({
      top: 100,
      left: 0,
      height: 500,
      width: 390,
      keyboardInset: 200,
    });
  });

  it("clamps negative visual viewport values", () => {
    expect(
      getVisualViewportFrame(
        { innerHeight: 800, innerWidth: 390 },
        { offsetTop: -20, offsetLeft: -10, height: -5, width: -1 },
      ),
    ).toEqual({
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      keyboardInset: 800,
    });
  });
});
