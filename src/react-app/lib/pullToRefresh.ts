/**
 * 引っ張って更新（PTR）の距離計算とジェスチャ判定（DOM 非依存）。
 */

/** 更新を発火する引っ張り距離（px） */
export const PULL_REFRESH_THRESHOLD = 64;

/** 引っ張りの最大表示距離（px） */
export const PULL_REFRESH_MAX = 96;

/** 引っ張り中インジケータの最小高さ（size-5 がクリップされない） */
export const PULL_INDICATOR_MIN_PX = 28;

/** 更新中に表示するインジケータ領域の高さ（px） */
export const PULL_REFRESH_HOLD_PX = 40;

/** プル確定前の最小移動量（px）。タップ・長押しと区別する */
export const PULL_ACTIVATION_PX = 8;

/** 生の deltaY に抵抗をかけた表示距離 */
const PULL_RESISTANCE_RATIO = 0.5;

export function applyPullResistance(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(PULL_REFRESH_MAX, deltaY * PULL_RESISTANCE_RATIO);
}

export function shouldTriggerRefresh(pullDistance: number): boolean {
  return pullDistance >= PULL_REFRESH_THRESHOLD;
}

export function isPullGesture(deltaX: number, deltaY: number): boolean {
  return deltaY > 0 && deltaY > Math.abs(deltaX);
}

/** 引っ張りインジケータの回転角（deg）。閾値以上は 360 で固定 */
export function pullIndicatorRotationDeg(pullDistance: number): number {
  return Math.min(1, pullDistance / PULL_REFRESH_THRESHOLD) * 360;
}

export function pullIndicatorSlotHeight(
  pullDistance: number,
  isRefreshing: boolean,
): number {
  if (isRefreshing) return PULL_REFRESH_HOLD_PX;
  if (pullDistance <= 0) return 0;
  return Math.max(pullDistance, PULL_INDICATOR_MIN_PX);
}
