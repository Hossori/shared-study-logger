/**
 * visualViewport と window からアプリシェル用の高さと scroll リセット要否を決める。
 */
export function visualViewportFrame(
  visualHeight: number | null,
  innerHeight: number,
  scrollY: number,
): { heightPx: number; resetScroll: boolean } {
  const heightPx =
    visualHeight !== null && visualHeight > 0 ? visualHeight : innerHeight;
  return {
    heightPx,
    resetScroll: scrollY !== 0,
  };
}
