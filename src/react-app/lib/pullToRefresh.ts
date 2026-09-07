/**
 * 引っ張って更新（PTR）の距離計算とジェスチャ判定（DOM 非依存）。
 */

/** 更新を発火する引っ張り距離（px） */
export const PULL_REFRESH_THRESHOLD = 64;

/** 引っ張りの最大表示距離（px） */
export const PULL_REFRESH_MAX = 96;

/** 生の deltaY に抵抗をかけた表示距離 */
const PULL_RESISTANCE_RATIO = 0.5;

export function applyPullResistance(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(PULL_REFRESH_MAX, deltaY * PULL_RESISTANCE_RATIO);
}

export function shouldTriggerRefresh(
  pullDistance: number,
  threshold: number = PULL_REFRESH_THRESHOLD,
): boolean {
  return pullDistance >= threshold;
}

export function isPullGesture(deltaX: number, deltaY: number): boolean {
  return deltaY > 0 && deltaY > Math.abs(deltaX);
}
