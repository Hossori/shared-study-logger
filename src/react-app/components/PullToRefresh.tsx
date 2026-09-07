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
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const pullConfirmedRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

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
    try {
      await onRefresh();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      resetPull();
    }
  }, [onRefresh, resetPull]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;

    scrollParentRef.current = findScrollParent(el);

    const onPointerDown = (event: PointerEvent) => {
      if (isRefreshingRef.current) return;
      const scrollParent = scrollParentRef.current;
      if (!scrollParent || scrollParent.scrollTop > 0) return;
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
        el.setPointerCapture(event.pointerId);
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
          el.releasePointerCapture(event.pointerId);
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

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", finishPointer);
    el.addEventListener("pointercancel", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", finishPointer);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [disabled, resetPull, runRefresh, updatePullDistance]);

  const indicatorHeight = isRefreshing ? pullDistance || 40 : pullDistance;

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
        {(isRefreshing || pullDistance > 0) && <Spinner className="size-5" />}
      </div>
      <div
        style={{
          transform:
            pullDistance > 0 || isRefreshing
              ? `translateY(${pullDistance}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
