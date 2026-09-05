export type VisualViewportLike =
  | {
      offsetTop: number;
      offsetLeft: number;
      height: number;
      width: number;
    }
  | null
  | undefined;

export type WindowSize = { innerHeight: number; innerWidth: number };

export function getVisualViewportFrame(
  size: WindowSize,
  visualViewport: VisualViewportLike,
): {
  top: number;
  left: number;
  height: number;
  width: number;
  keyboardInset: number;
} {
  if (!visualViewport) {
    return {
      top: 0,
      left: 0,
      height: size.innerHeight,
      width: size.innerWidth,
      keyboardInset: 0,
    };
  }

  const top = Math.max(0, visualViewport.offsetTop);
  const left = Math.max(0, visualViewport.offsetLeft);
  const height = Math.max(0, visualViewport.height);
  const width = Math.max(0, visualViewport.width);
  const keyboardInset = Math.max(0, size.innerHeight - height - top);

  return { top, left, height, width, keyboardInset };
}
