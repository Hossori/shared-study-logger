/**
 * スクロール要素先頭の下方向ジェスチャを reducePullGesture に渡し、effect を実行する。
 */
import { useEffect, useRef, type RefObject } from "react";
import {
  createIdlePullGestureState,
  pullGestureUi,
  reducePullGesture,
  type PointerSource,
  type PullGestureEvent,
} from "../lib/pullGesture";

function pointerSource(pointerType: string): PointerSource {
  if (pointerType === "mouse") return "mouse";
  if (pointerType === "pen") return "pen";
  return "touch";
}

export type TopEdgeGestureDistanceFlags = {
  isPulling: boolean;
  isRefreshing: boolean;
};

export function useTopEdgeGesture({
  scrollRef,
  enabled,
  trackPull,
  onRefresh,
  onDistanceChange,
}: {
  scrollRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  trackPull: boolean;
  onRefresh?: () => void | Promise<void>;
  onDistanceChange?: (
    distance: number,
    flags: TopEdgeGestureDistanceFlags,
  ) => void;
}) {
  const stateRef = useRef(createIdlePullGestureState());
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const onDistanceChangeRef = useRef(onDistanceChange);
  onDistanceChangeRef.current = onDistanceChange;

  useEffect(() => {
    const notifyIdle = () => {
      stateRef.current = createIdlePullGestureState();
      onDistanceChangeRef.current?.(0, {
        isPulling: false,
        isRefreshing: false,
      });
    };

    if (!enabled) {
      notifyIdle();
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    let cancelled = false;
    stateRef.current = createIdlePullGestureState();

    const clearTouchAction = () => {
      el.style.removeProperty("touch-action");
    };

    const notify = () => {
      const ui = pullGestureUi(stateRef.current);
      onDistanceChangeRef.current?.(ui.pullDistance, {
        isPulling: ui.isPulling,
        isRefreshing: ui.isRefreshing,
      });
    };

    const dispatch = (event: PullGestureEvent, domEvent?: Event) => {
      const result = reducePullGesture(stateRef.current, event, { trackPull });
      stateRef.current = result.state;
      for (const effect of result.effects) {
        switch (effect) {
          case "preventDefault":
            if (domEvent?.cancelable) {
              domEvent.preventDefault();
            }
            break;
          case "setTouchActionNone":
            el.style.touchAction = "none";
            break;
          case "clearTouchAction":
            clearTouchAction();
            break;
          case "triggerRefresh": {
            void (async () => {
              try {
                await onRefreshRef.current?.();
              } finally {
                if (!cancelled) {
                  dispatch({ type: "refresh_settled" });
                }
              }
            })();
            break;
          }
        }
      }
      notify();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      dispatch({
        type: "start",
        channel: "touch",
        source: "touch",
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
        scrollTop: el.scrollTop,
      });
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const session = stateRef.current;
      if (session.inputLock !== "touch") return;
      const touch = event.touches[0];
      if (touch.identifier !== session.id) return;
      dispatch(
        {
          type: "move",
          channel: "touch",
          x: touch.clientX,
          y: touch.clientY,
          id: touch.identifier,
          scrollTop: el.scrollTop,
        },
        event,
      );
    };

    const matchingTouchId = (event: TouchEvent): boolean => {
      const session = stateRef.current;
      if (session.inputLock !== "touch") return false;
      return Array.from(event.changedTouches).some(
        (touch) => touch.identifier === session.id,
      );
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!matchingTouchId(event)) return;
      dispatch({ type: "end", channel: "touch", id: stateRef.current.id });
    };

    const onTouchCancel = (event: TouchEvent) => {
      if (!matchingTouchId(event)) return;
      dispatch({ type: "cancel", channel: "touch", id: stateRef.current.id });
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dispatch({
        type: "start",
        channel: "pointer",
        source: pointerSource(event.pointerType),
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
        scrollTop: el.scrollTop,
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      const session = stateRef.current;
      if (session.inputLock !== "pointer") return;
      if (event.pointerId !== session.id) return;
      dispatch(
        {
          type: "move",
          channel: "pointer",
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
          scrollTop: el.scrollTop,
        },
        event,
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      const session = stateRef.current;
      if (session.inputLock !== "pointer") return;
      if (event.pointerId !== session.id) return;
      dispatch({ type: "end", channel: "pointer", id: event.pointerId });
    };

    const onPointerCancel = (event: PointerEvent) => {
      const session = stateRef.current;
      if (session.inputLock !== "pointer") return;
      if (event.pointerId !== session.id) return;
      dispatch({ type: "cancel", channel: "pointer", id: event.pointerId });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      cancelled = true;
      clearTouchAction();
      stateRef.current = createIdlePullGestureState();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [enabled, scrollRef, trackPull]);
}
