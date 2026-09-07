import type { RefObject } from "react";
import { useTopEdgeGesture } from "./useTopEdgeGesture";

/**
 * モバイル幅で scrollTop === 0 のとき、下方向オーバースクロール（ヘッダ追従）を抑止する。
 * 記録一覧で PTR が活性なときは Layout 側で無効化する。
 */
export function usePreventTopOverscroll(
  scrollRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useTopEdgeGesture({
    scrollRef,
    enabled,
    trackPull: false,
  });
}
