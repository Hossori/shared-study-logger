import { describe, expect, it } from "vitest";
import {
  SHEET_DRAG_DISMISS_PX,
  SHEET_DRAG_OVERSCROLL_PX,
  resolveSheetDragRelease,
  sheetDismissTranslateY,
  sheetOffsetFromDelta,
} from "../../src/react-app/lib/sheetDrag";

describe("sheetOffsetFromDelta", () => {
  it("passes positive drag through unchanged", () => {
    expect(sheetOffsetFromDelta(0)).toBe(0);
    expect(sheetOffsetFromDelta(40)).toBe(40);
    expect(sheetOffsetFromDelta(200)).toBe(200);
  });

  it("caps upward drag at the overscroll limit", () => {
    expect(sheetOffsetFromDelta(-10)).toBe(-10);
    expect(sheetOffsetFromDelta(-SHEET_DRAG_OVERSCROLL_PX)).toBe(
      -SHEET_DRAG_OVERSCROLL_PX,
    );
    expect(sheetOffsetFromDelta(-100)).toBe(-SHEET_DRAG_OVERSCROLL_PX);
  });
});

describe("resolveSheetDragRelease", () => {
  it("snaps back below the dismiss threshold", () => {
    expect(resolveSheetDragRelease(0, 400)).toBe("snap");
    expect(resolveSheetDragRelease(47, 400)).toBe("snap");
  });

  it("dismisses at or above the dismiss threshold", () => {
    expect(resolveSheetDragRelease(48, 100)).toBe("dismiss");
    expect(resolveSheetDragRelease(120, 400)).toBe("dismiss");
  });

  it("uses 30% of sheet height when it is below the global dismiss cap", () => {
    expect(resolveSheetDragRelease(89, 300)).toBe("snap");
    expect(resolveSheetDragRelease(90, 300)).toBe("dismiss");
  });

  it("never exceeds the global dismiss cap", () => {
    expect(resolveSheetDragRelease(SHEET_DRAG_DISMISS_PX - 1, 1000)).toBe(
      "snap",
    );
    expect(resolveSheetDragRelease(SHEET_DRAG_DISMISS_PX, 1000)).toBe(
      "dismiss",
    );
  });
});

describe("sheetDismissTranslateY", () => {
  it("returns the sheet height for off-screen dismissal", () => {
    expect(sheetDismissTranslateY(320)).toBe(320);
    expect(sheetDismissTranslateY(0)).toBe(0);
  });
});
