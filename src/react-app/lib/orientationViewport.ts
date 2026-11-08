/**
 * iOS は回転後に layout viewport の幅を横向きのまま残すことがある。
 * `sm` 判定と `position: fixed` の当たり判定が画面とずれ、一部のボタンが押せなくなる。
 * viewport meta を一度変えて戻すと、WebKit が幅を計算し直す。
 */
export type OrientationKind = "portrait" | "landscape";

export function orientationKindFromSignals(input: {
  width: number;
  height: number;
  screenOrientationType?: string | null;
  windowOrientation?: number | null;
}): OrientationKind {
  const angle = input.windowOrientation;
  if (angle === 90 || angle === -90) return "landscape";
  if (angle === 0 || angle === 180) return "portrait";
  const type = input.screenOrientationType ?? "";
  if (type.startsWith("landscape")) return "landscape";
  if (type.startsWith("portrait")) return "portrait";
  return input.width > input.height ? "landscape" : "portrait";
}

export function viewportContentForResettle(content: string): {
  bumped: string;
  restored: string;
} {
  const restored = content;
  const bumped = /(?:^|,)\s*maximum-scale=/.test(content)
    ? content
    : `${content}, maximum-scale=1`;
  return { bumped, restored };
}
