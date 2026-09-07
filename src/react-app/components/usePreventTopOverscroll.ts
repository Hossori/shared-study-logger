import { useEffect, type RefObject } from "react";
import { isPullGesture } from "../lib/pullToRefresh";

/**
 * モバイル幅で scrollTop === 0 のとき、下方向オーバースクロール（ヘッダ追従）を抑止する。
 * TouchEvent を優先し、未使用時のみ pointer で扱う。
 */
export function usePreventTopOverscroll(
  scrollRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    let touchStart: { x: number; y: number; identifier: number } | null = null;
    let pointerStart: { x: number; y: number; pointerId: number } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      pointerStart = null;
      if (el.scrollTop > 0) return;
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchStart) return;
      if (el.scrollTop > 0) {
        touchStart = null;
        return;
      }
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.identifier !== touchStart.identifier) return;

      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      if (deltaY <= 0) return;
      if (!isPullGesture(deltaX, deltaY)) return;

      event.preventDefault();
    };

    const clearTouchStart = (event: TouchEvent) => {
      if (!touchStart) return;
      const ended = Array.from(event.changedTouches).some(
        (t) => t.identifier === touchStart!.identifier,
      );
      if (ended) touchStart = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (touchStart) return;
      if (el.scrollTop > 0) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerStart = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (touchStart) return;
      if (!pointerStart) return;
      if (event.pointerId !== pointerStart.pointerId) return;
      if (el.scrollTop > 0) {
        pointerStart = null;
        return;
      }

      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      if (deltaY <= 0) return;
      if (!isPullGesture(deltaX, deltaY)) return;

      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (touchStart) return;
      if (pointerStart?.pointerId === event.pointerId) {
        pointerStart = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", clearTouchStart);
    el.addEventListener("touchcancel", clearTouchStart);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", clearTouchStart);
      el.removeEventListener("touchcancel", clearTouchStart);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [enabled, scrollRef]);
}
