/**
 * スクロール親（Layout の main）先頭で下に引っ張ると onRefresh を呼ぶ。
 * 入れ子スクロールは作らず、最近傍の overflow-y auto/scroll 祖先を追跡する。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useIsMaxSm } from "../features/notifications/useIsMaxSm";
import {
  applyPullResistance,
  isPullGesture,
  shouldTriggerRefresh,
} from "../lib/pullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
}

/** プル確定前の最小移動量（px）。タップ・長押しと区別する */
const PULL_ACTIVATION_PX = 8;

/** 更新中に表示するインジケータ領域の高さ（px） */
const REFRESH_HOLD_PX = 40;

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export default function PullToRefresh({
  onRefresh,
  disabled = false,
  children,
}: PullToRefreshProps) {
  const isMobileLayout = useIsMaxSm();
  const ptrEnabled = isMobileLayout && !disabled;

  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    identifier: number;
  } | null>(null);
  const pullConfirmedRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const updatePullDistance = useCallback((distance: number) => {
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  }, []);

  const resetPull = useCallback(() => {
    updatePullDistance(0);
    setIsPulling(false);
    pullConfirmedRef.current = false;
    pointerStartRef.current = null;
    touchStartRef.current = null;
  }, [updatePullDistance]);

  const runRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    updatePullDistance(REFRESH_HOLD_PX);
    try {
      await onRefreshRef.current();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      resetPull();
    }
  }, [resetPull, updatePullDistance]);

  const finishPull = useCallback(() => {
    if (pullConfirmedRef.current) {
      if (
        shouldTriggerRefresh(pullDistanceRef.current) &&
        !isRefreshingRef.current
      ) {
        void runRefresh();
      } else if (!isRefreshingRef.current) {
        resetPull();
      }
    }

    pointerStartRef.current = null;
    touchStartRef.current = null;
    if (!isRefreshingRef.current) {
      pullConfirmedRef.current = false;
      setIsPulling(false);
    }
  }, [resetPull, runRefresh]);

  useEffect(() => {
    if (!ptrEnabled) {
      resetPull();
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const scrollParent = findScrollParent(el);
    if (!scrollParent) return;

    const onTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (scrollParent.scrollTop > 0) return;
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        identifier: touch.identifier,
      };
      pullConfirmedRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isRefreshingRef.current || !touchStartRef.current) return;
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      if (touch.identifier !== touchStartRef.current.identifier) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (deltaY < 0) {
        touchStartRef.current = null;
        if (!isRefreshingRef.current) {
          resetPull();
        }
        return;
      }

      if (!isPullGesture(deltaX, deltaY)) return;

      event.preventDefault();

      if (!pullConfirmedRef.current) {
        if (deltaY < PULL_ACTIVATION_PX) {
          updatePullDistance(applyPullResistance(deltaY));
          return;
        }
        pullConfirmedRef.current = true;
        setIsPulling(true);
      }

      updatePullDistance(applyPullResistance(deltaY));
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!touchStartRef.current) return;
      const ended = Array.from(event.changedTouches).some(
        (t) => t.identifier === touchStartRef.current!.identifier,
      );
      if (!ended) return;
      finishPull();
    };

    const onTouchCancel = (event: TouchEvent) => {
      if (!touchStartRef.current) return;
      const cancelled = Array.from(event.changedTouches).some(
        (t) => t.identifier === touchStartRef.current!.identifier,
      );
      if (!cancelled) return;
      if (!isRefreshingRef.current) {
        resetPull();
      }
      touchStartRef.current = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (isRefreshingRef.current) return;
      if (scrollParent.scrollTop > 0) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      pullConfirmedRef.current = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (isRefreshingRef.current || !pointerStartRef.current) return;
      if (event.pointerId !== pointerStartRef.current.pointerId) return;

      const deltaX = event.clientX - pointerStartRef.current.x;
      const deltaY = event.clientY - pointerStartRef.current.y;

      if (!pullConfirmedRef.current) {
        if (deltaY < 0) {
          pointerStartRef.current = null;
          return;
        }
        if (!isPullGesture(deltaX, deltaY)) return;
        if (deltaY < PULL_ACTIVATION_PX) return;

        pullConfirmedRef.current = true;
        setIsPulling(true);
      }

      if (pullConfirmedRef.current) {
        event.preventDefault();
        updatePullDistance(applyPullResistance(deltaY));
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!pointerStartRef.current) return;
      if (event.pointerId !== pointerStartRef.current.pointerId) return;
      finishPull();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (pointerStartRef.current?.pointerId !== event.pointerId) return;
      if (!isRefreshingRef.current) {
        resetPull();
      }
      pointerStartRef.current = null;
    };

    scrollParent.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });
    scrollParent.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollParent.addEventListener("touchend", onTouchEnd);
    scrollParent.addEventListener("touchcancel", onTouchCancel);

    scrollParent.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      scrollParent.removeEventListener("touchstart", onTouchStart);
      scrollParent.removeEventListener("touchmove", onTouchMove);
      scrollParent.removeEventListener("touchend", onTouchEnd);
      scrollParent.removeEventListener("touchcancel", onTouchCancel);

      scrollParent.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ptrEnabled, finishPull, resetPull, updatePullDistance]);

  const indicatorHeight = isRefreshing ? REFRESH_HOLD_PX : pullDistance;

  return (
    <div
      ref={containerRef}
      className={cn(isPulling || isRefreshing ? "select-none" : undefined)}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        {isRefreshing && <Spinner className="size-5" />}
      </div>
      {children}
    </div>
  );
}
