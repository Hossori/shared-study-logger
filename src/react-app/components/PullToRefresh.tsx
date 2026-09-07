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

  useEffect(() => {
    if (!ptrEnabled) return;
    const el = containerRef.current;
    if (!el) return;

    const scrollParent = findScrollParent(el);
    if (!scrollParent) return;

    const onPointerDown = (event: PointerEvent) => {
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
        scrollParent.setPointerCapture(event.pointerId);
      }

      if (pullConfirmedRef.current) {
        event.preventDefault();
        updatePullDistance(applyPullResistance(deltaY));
      }
    };

    const finishPointer = (event: PointerEvent) => {
      if (!pointerStartRef.current) return;
      if (event.pointerId !== pointerStartRef.current.pointerId) return;

      if (pullConfirmedRef.current) {
        try {
          scrollParent.releasePointerCapture(event.pointerId);
        } catch {
          // capture されていない場合は無視
        }
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
      if (!isRefreshingRef.current) {
        pullConfirmedRef.current = false;
        setIsPulling(false);
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (pointerStartRef.current?.pointerId !== event.pointerId) return;
      if (!isRefreshingRef.current) {
        resetPull();
      }
      pointerStartRef.current = null;
    };

    scrollParent.addEventListener("pointerdown", onPointerDown);
    scrollParent.addEventListener("pointermove", onPointerMove, {
      passive: false,
    });
    scrollParent.addEventListener("pointerup", finishPointer);
    scrollParent.addEventListener("pointercancel", onPointerCancel);

    return () => {
      scrollParent.removeEventListener("pointerdown", onPointerDown);
      scrollParent.removeEventListener("pointermove", onPointerMove);
      scrollParent.removeEventListener("pointerup", finishPointer);
      scrollParent.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ptrEnabled, resetPull, runRefresh, updatePullDistance]);

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
