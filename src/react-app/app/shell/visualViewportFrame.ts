/**
 * visualViewport と window からアプリシェル用の高さと scroll リセット要否を決める。
 */
export function visualViewportFrame(
  visualHeight: number | null,
  innerHeight: number,
  scrollY: number,
  offsetTop: number,
): { heightPx: number; resetScroll: boolean; translateY: number } {
  const heightPx =
    visualHeight !== null && visualHeight > 0 ? visualHeight : innerHeight;
  return {
    heightPx,
    resetScroll: scrollY !== 0,
    translateY: offsetTop > 0 ? offsetTop : 0,
  };
}
