export const SHEET_DRAG_OVERSCROLL_PX = 28;
export const SHEET_DRAG_DISMISS_PX = 96;

export function sheetOffsetFromDelta(dy: number): number {
  if (dy >= 0) return dy;
  return Math.max(dy, -SHEET_DRAG_OVERSCROLL_PX);
}

export function resolveSheetDragRelease(
  offsetY: number,
  sheetHeight: number,
): "dismiss" | "snap" {
  const threshold = Math.min(
    SHEET_DRAG_DISMISS_PX,
    Math.max(48, sheetHeight * 0.3),
  );
  return offsetY >= threshold ? "dismiss" : "snap";
}

export function sheetDismissTranslateY(sheetHeight: number): number {
  return sheetHeight;
}
