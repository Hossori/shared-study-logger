/**
 * 24時間アナログ時計（内側 1〜12、外側 13〜24）の幾何計算。
 * 24 は 0 時（真夜中）として扱う。
 */

export const INNER_CLOCK_HOURS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export const OUTER_CLOCK_HOURS = [
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

export const ANALOG_CLOCK_SIZE = 280;
export const ANALOG_CLOCK_CENTER = ANALOG_CLOCK_SIZE / 2;
export const INNER_NUMBER_RADIUS = 74;
export const OUTER_NUMBER_RADIUS = 118;
export const INNER_HAND_LENGTH = 62;
export const OUTER_HAND_LENGTH = 108;
export const MINUTE_HAND_LENGTH = 98;

/** 時計盤ラベル 24 を 0〜23 時へ。 */
export function clockLabelToHour(label: number): number {
  return label === 24 ? 0 : label;
}

/** 0〜23 時を時計盤ラベル（0 時は 24）へ。 */
export function hourToClockLabel(hour: number): number {
  return hour === 0 ? 24 : hour;
}

export function isOuterClockLabel(label: number): boolean {
  return label >= 13;
}

/** 12 時位置を 0° とした時計回りの角度。 */
export function clockLabelToAngleDegrees(label: number): number {
  const hour = clockLabelToHour(label);
  return (hour % 12) * 30;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDegrees: number,
): { x: number; y: number } {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

export function hourHandLength(
  label: number,
  innerLength = INNER_HAND_LENGTH,
  outerLength = OUTER_HAND_LENGTH,
): number {
  return isOuterClockLabel(label) ? outerLength : innerLength;
}

export function hourHandAngleDegrees(hour: number, minute: number): number {
  const label = hourToClockLabel(hour);
  return clockLabelToAngleDegrees(label) + minute * 0.5;
}

export function minuteHandAngleDegrees(minute: number): number {
  return minute * 6;
}

/**
 * クリック位置から最も近い時ラベルを返す。
 * 中心に近すぎる、または盤面の外なら null。
 */
export function hourLabelFromPointer(
  x: number,
  y: number,
  cx = ANALOG_CLOCK_CENTER,
  cy = ANALOG_CLOCK_CENTER,
  innerRadius = INNER_NUMBER_RADIUS,
  outerRadius = OUTER_NUMBER_RADIUS,
): number | null {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < innerRadius * 0.4 || dist > outerRadius + 24) {
    return null;
  }

  let degrees = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (degrees < 0) degrees += 360;
  const index = Math.round(degrees / 30) % 12;
  const midpoint = (innerRadius + outerRadius) / 2;
  const isOuter = dist >= midpoint;
  if (isOuter) {
    return index === 0 ? 24 : index + 12;
  }
  return index === 0 ? 12 : index;
}
