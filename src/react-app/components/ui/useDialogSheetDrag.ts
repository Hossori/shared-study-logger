"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  resolveSheetDragRelease,
  sheetDismissTranslateY,
  sheetOffsetFromDelta,
} from "@/lib/sheetDrag";

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const SHEET_DRAG_TRANSITION_MS = 200;
const SHEET_DRAG_TRANSITION_FALLBACK_MS = 280;

type SheetGesture = "idle" | "dragging" | "snapping" | "dismissing";

function subscribeMobileViewport(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

interface UseDialogSheetDragOptions {
  enabled: boolean;
  open?: boolean;
  popupRef: RefObject<HTMLDivElement | null>;
  hiddenCloseRef: RefObject<HTMLButtonElement | null>;
}

export function useDialogSheetDrag({
  enabled,
  open,
  popupRef,
  hiddenCloseRef,
}: UseDialogSheetDragOptions) {
  const pointerStartYRef = useRef(0);
  const offsetYRef = useRef(0);
  const resetGestureRef = useRef<() => void>(() => {});
  const transitionTimerRef = useRef<number | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [gesture, setGesture] = useState<SheetGesture>("idle");
  const isMobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    () => false,
  );
  const isMobile = enabled && isMobileViewport;

  const resetGesture = useCallback(() => {
    offsetYRef.current = 0;
    setOffsetY(0);
    setGesture("idle");
  }, []);

  useEffect(() => {
    resetGestureRef.current = resetGesture;
  }, [resetGesture]);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const finishSnap = useCallback(() => {
    clearTransitionTimer();
    resetGesture();
  }, [clearTransitionTimer, resetGesture]);

  const finishDismiss = useCallback(() => {
    clearTransitionTimer();
    hiddenCloseRef.current?.click();
  }, [clearTransitionTimer, hiddenCloseRef]);

  const armTransitionFallback = useCallback(
    (finish: () => void) => {
      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(
        finish,
        SHEET_DRAG_TRANSITION_FALLBACK_MS,
      );
    },
    [clearTransitionTimer],
  );

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  useEffect(() => {
    if (!enabled) return;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleViewportChange = () => {
      if (!mediaQuery.matches) {
        clearTransitionTimer();
        resetGestureRef.current();
      }
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, [clearTransitionTimer, enabled]);

  useLayoutEffect(() => {
    if (!enabled || open !== true) return;
    clearTransitionTimer();
    resetGestureRef.current();
  }, [clearTransitionTimer, enabled, open]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile || gesture === "dismissing") return;
      clearTransitionTimer();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerStartYRef.current = event.clientY;
      setGesture("dragging");
    },
    [clearTransitionTimer, gesture, isMobile],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile) return;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

      const dy = event.clientY - pointerStartYRef.current;
      const nextOffset = sheetOffsetFromDelta(dy);
      offsetYRef.current = nextOffset;
      setOffsetY(nextOffset);
    },
    [isMobile],
  );

  const startSnapBack = useCallback(() => {
    if (offsetYRef.current === 0) {
      finishSnap();
      return;
    }

    setGesture("snapping");
    requestAnimationFrame(() => {
      offsetYRef.current = 0;
      setOffsetY(0);
    });
    armTransitionFallback(finishSnap);
  }, [armTransitionFallback, finishSnap]);

  const startDismiss = useCallback(() => {
    const sheetHeight = popupRef.current?.offsetHeight ?? 0;
    const dismissY = sheetDismissTranslateY(sheetHeight);

    setGesture("dismissing");

    if (offsetYRef.current === dismissY) {
      offsetYRef.current = dismissY;
      setOffsetY(dismissY);
      finishDismiss();
      return;
    }

    requestAnimationFrame(() => {
      offsetYRef.current = dismissY;
      setOffsetY(dismissY);
    });
    armTransitionFallback(finishDismiss);
  }, [armTransitionFallback, finishDismiss, popupRef]);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile) return;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

      event.currentTarget.releasePointerCapture(event.pointerId);

      const sheetHeight = popupRef.current?.offsetHeight ?? 0;
      const action = resolveSheetDragRelease(offsetYRef.current, sheetHeight);
      if (action === "dismiss") {
        startDismiss();
        return;
      }
      startSnapBack();
    },
    [isMobile, popupRef, startDismiss, startSnapBack],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isMobile) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      startSnapBack();
    },
    [isMobile, startSnapBack],
  );

  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== "transform") return;

      if (gesture === "snapping") {
        finishSnap();
        return;
      }

      if (gesture === "dismissing") {
        finishDismiss();
      }
    },
    [enabled, finishDismiss, finishSnap, gesture],
  );

  const isGesturing = gesture !== "idle" || offsetY !== 0;
  const shouldApplyInlineTransform = isMobile && isGesturing;

  const popupStyle: CSSProperties | undefined = shouldApplyInlineTransform
    ? {
        transform: `translate3d(0, ${offsetY}px, 0)`,
        ...(gesture === "snapping" || gesture === "dismissing"
          ? {
              transition: `transform ${SHEET_DRAG_TRANSITION_MS}ms ease-out`,
            }
          : {}),
      }
    : undefined;

  const popupClassName =
    isMobile && gesture !== "idle"
      ? "max-sm:data-open:animate-none max-sm:data-closed:animate-none max-sm:touch-none max-sm:select-none"
      : undefined;

  return {
    gesture,
    popupStyle,
    popupClassName,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    handleTransitionEnd,
  };
}
