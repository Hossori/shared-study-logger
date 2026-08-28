import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface DrumRollOption<T> {
  value: T;
  label: string;
}

interface DrumRollPickerProps<T> {
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  options: readonly DrumRollOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemHeight?: number;
  visibleCount?: number;
}

function optionIndex<T>(
  options: readonly DrumRollOption<T>[],
  value: T,
): number {
  const index = options.findIndex((option) => Object.is(option.value, value));
  return index < 0 ? 0 : index;
}

export function DrumRollPicker<T>({
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  options,
  value,
  onChange,
  className,
  itemHeight = 36,
  visibleCount = 5,
}: DrumRollPickerProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const skipScrollSyncRef = useRef(false);
  const userScrollingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const padCount = Math.max(1, Math.floor((visibleCount - 1) / 2));
  const selectedIndex = optionIndex(options, value);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const syncScroll = () => {
      if (userScrollingRef.current) return;
      const nextTop = selectedIndex * itemHeight;
      if (Math.abs(scroller.scrollTop - nextTop) < 1) return;
      skipScrollSyncRef.current = true;
      scroller.scrollTop = nextTop;
      skipScrollSyncRef.current = false;
    };

    syncScroll();
    const observer = new ResizeObserver(syncScroll);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [itemHeight, selectedIndex]);

  useLayoutEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const emitIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    const next = options[clamped];
    if (!next || Object.is(next.value, value)) return;
    onChange(next.value);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (skipScrollSyncRef.current) return;
    userScrollingRef.current = true;
    const index = Math.round(event.currentTarget.scrollTop / itemHeight);
    emitIndex(index);
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
      settleTimerRef.current = null;
    }, 120);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      emitIndex(selectedIndex - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      emitIndex(selectedIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      emitIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      emitIndex(options.length - 1);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      style={{ height: itemHeight * visibleCount }}
    >
      <div
        aria-hidden
        className="border-border pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-md border-y bg-transparent"
        style={{ height: itemHeight }}
      />
      <div
        ref={scrollerRef}
        id={id}
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-activedescendant={id ? `${id}-option-${selectedIndex}` : undefined}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="text-muted-foreground h-full snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingBlock: itemHeight * padCount,
          maskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
        }}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <div
              key={`${option.label}-${index}`}
              id={id ? `${id}-option-${index}` : undefined}
              role="option"
              aria-selected={selected}
              onClick={() => {
                userScrollingRef.current = false;
                if (settleTimerRef.current !== null) {
                  window.clearTimeout(settleTimerRef.current);
                  settleTimerRef.current = null;
                }
                emitIndex(index);
                const scroller = scrollerRef.current;
                if (scroller) {
                  skipScrollSyncRef.current = true;
                  scroller.scrollTop = index * itemHeight;
                  skipScrollSyncRef.current = false;
                }
              }}
              className={cn(
                "flex cursor-pointer snap-center items-center justify-center text-sm select-none",
                selected && "text-foreground font-medium",
              )}
              style={{ height: itemHeight }}
            >
              {option.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
