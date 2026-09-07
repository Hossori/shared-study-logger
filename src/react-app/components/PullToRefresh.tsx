/**
 * スクロール親（Layout のヘッダ下ラッパ）先頭で下に引っ張ると onRefresh を呼ぶ。
 * スクロール容器は LayoutScrollContext から受け取り、入れ子スクロールは作らない。
 */
import { useEffect, useState, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutScroll } from "./LayoutScrollContext";
import { useIsMaxSm } from "./useIsMaxSm";
import { useTopEdgeGesture } from "./useTopEdgeGesture";
import {
  pullIndicatorRotationDeg,
  pullIndicatorSlotHeight,
} from "../lib/pullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
}

export default function PullToRefresh({
  onRefresh,
  disabled = false,
  children,
}: PullToRefreshProps) {
  const isMobileLayout = useIsMaxSm();
  const ptrEnabled = isMobileLayout && !disabled;
  const { scrollRef, setPullToRefreshActive } = useLayoutScroll();

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (!ptrEnabled) {
      setPullToRefreshActive(false);
      return;
    }
    setPullToRefreshActive(true);
    return () => setPullToRefreshActive(false);
  }, [ptrEnabled, setPullToRefreshActive]);

  useTopEdgeGesture({
    scrollRef,
    enabled: ptrEnabled,
    trackPull: true,
    onRefresh,
    onDistanceChange: (distance, flags) => {
      setPullDistance(distance);
      setIsPulling(flags.isPulling);
      setIsRefreshing(flags.isRefreshing);
    },
  });

  const indicatorHeight = pullIndicatorSlotHeight(pullDistance, isRefreshing);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div className={cn(isPulling || isRefreshing ? "select-none" : undefined)}>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: indicatorHeight }}
        aria-hidden={indicatorHeight === 0}
      >
        {showIndicator && (
          <Loader2Icon
            className={cn(
              "text-muted-foreground size-5",
              isRefreshing && "animate-spin",
            )}
            style={
              isRefreshing
                ? undefined
                : {
                    transform: `rotate(${pullIndicatorRotationDeg(pullDistance)}deg)`,
                  }
            }
            aria-hidden
          />
        )}
      </div>
      {children}
    </div>
  );
}
