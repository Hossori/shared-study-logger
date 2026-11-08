/**
 * シェルの高さと、キーボードがレイアウト下端にかぶる量を決める。
 * 文字入力中はシェルを動かさない。ダイアログの fixed 基準がずれ、記録フォームが崩れる。
 */

const WIDTH_CHANGE_PX = 40;
/** これより visualViewport が短いときはキーボードで縮んだとみなす。 */
const KEYBOARD_GAP_PX = 80;

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "radio",
  "file",
  "submit",
  "reset",
  "image",
  "hidden",
  "range",
  "color",
]);

export function isTextEntryElement(
  tagName: string,
  inputType: string | null,
  contentEditable: boolean,
): boolean {
  if (contentEditable) return true;
  if (tagName === "TEXTAREA" || tagName === "SELECT") return true;
  if (tagName === "INPUT") {
    const type = (inputType ?? "text").toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(type);
  }
  return false;
}

/** レイアウト下端から、見えている下端までの距離。キーボードが下から覆う量。 */
export function keyboardOverlapPx(
  innerHeight: number,
  visualHeight: number | null,
  offsetTop: number,
): number {
  if (visualHeight == null || visualHeight <= 0) return 0;
  const overlap = innerHeight - visualHeight - Math.max(0, offsetTop);
  return overlap > 0 ? overlap : 0;
}

export function shellFrame(input: {
  visualHeight: number | null;
  innerHeight: number;
  scrollY: number;
  textEntryFocused: boolean;
  /** null は初回と向きの変化。数値は幅の差分で、小さい変化はキーボード扱いにする。 */
  widthDelta: number | null;
}): { heightPx: number | null; resetScroll: boolean } {
  if (input.textEntryFocused) {
    return { heightPx: null, resetScroll: false };
  }
  const keyboardLikely =
    input.visualHeight != null &&
    input.visualHeight > 0 &&
    input.innerHeight - input.visualHeight > KEYBOARD_GAP_PX;
  const orientationLike =
    input.widthDelta == null || Math.abs(input.widthDelta) >= WIDTH_CHANGE_PX;
  if (keyboardLikely && !orientationLike) {
    return { heightPx: null, resetScroll: false };
  }
  const heightPx =
    input.visualHeight != null && input.visualHeight > 0
      ? input.visualHeight
      : input.innerHeight;
  return {
    heightPx,
    resetScroll: input.scrollY !== 0,
  };
}
