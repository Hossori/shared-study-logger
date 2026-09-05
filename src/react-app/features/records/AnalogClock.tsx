/**
 * アナログ時計。時面は内側 1〜12・外側 13〜0。
 * 時を選ぶと 5 分刻みの分面に切り替わる。
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  ANALOG_CLOCK_CENTER,
  ANALOG_CLOCK_SIZE,
  CLOCK_MINUTE_RADIUS,
  CLOCK_MINUTES,
  INNER_CLOCK_HOURS,
  INNER_NUMBER_RADIUS,
  MINUTE_HAND_LENGTH,
  OUTER_CLOCK_HOURS,
  OUTER_NUMBER_RADIUS,
  clockLabelToAngleDegrees,
  hourHandAngleDegrees,
  hourHandLength,
  hourLabelFromPointer,
  minuteFromPointer,
  minuteHandAngleDegrees,
  polarToCartesian,
  snapToClockMinute,
} from "./analogClockUtils";

export type AnalogClockMode = "hour" | "minute";

interface AnalogClockProps {
  idPrefix: string;
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onMinuteCommit?: () => void;
  className?: string;
}

function numberStyle(angleDegrees: number, radius: number): CSSProperties {
  const { x, y } = polarToCartesian(
    ANALOG_CLOCK_CENTER,
    ANALOG_CLOCK_CENTER,
    radius,
    angleDegrees,
  );
  return {
    left: `${(x / ANALOG_CLOCK_SIZE) * 100}%`,
    top: `${(y / ANALOG_CLOCK_SIZE) * 100}%`,
    transform: "translate(-50%, -50%)",
  };
}

function ClockHand({
  angle,
  length,
  className,
  width,
}: {
  angle: number;
  length: number;
  className: string;
  width: number;
}) {
  const tip = polarToCartesian(
    ANALOG_CLOCK_CENTER,
    ANALOG_CLOCK_CENTER,
    length,
    angle,
  );
  const tail = polarToCartesian(
    ANALOG_CLOCK_CENTER,
    ANALOG_CLOCK_CENTER,
    length * 0.18,
    angle + 180,
  );
  return (
    <line
      x1={tail.x}
      y1={tail.y}
      x2={tip.x}
      y2={tip.y}
      className={className}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

export default function AnalogClock({
  idPrefix,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  onMinuteCommit,
  className,
}: AnalogClockProps) {
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDuringGestureRef = useRef(false);
  const modeSwitchTimerRef = useRef<number | null>(null);
  const skipInitialFocusRef = useRef(true);
  const [mode, setMode] = useState<AnalogClockMode>("hour");
  const [capturing, setCapturing] = useState(false);
  const selectedMinute = snapToClockMinute(minute);
  const hourAngle = hourHandAngleDegrees(hour);
  const minuteAngle = minuteHandAngleDegrees(selectedMinute);
  const hourLength = hourHandLength(hour);

  useEffect(() => {
    return () => {
      if (modeSwitchTimerRef.current != null) {
        window.clearTimeout(modeSwitchTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (skipInitialFocusRef.current) {
      skipInitialFocusRef.current = false;
      return;
    }
    const selected = rootRef.current?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    selected?.focus();
  }, [mode]);

  const setValueFromPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * ANALOG_CLOCK_SIZE;
      const y = ((event.clientY - rect.top) / rect.height) * ANALOG_CLOCK_SIZE;
      if (mode === "hour") {
        const label = hourLabelFromPointer(x, y);
        if (label == null) return;
        selectedDuringGestureRef.current = true;
        onHourChange(label);
        return;
      }
      const nextMinute = minuteFromPointer(x, y);
      if (nextMinute == null) return;
      selectedDuringGestureRef.current = true;
      onMinuteChange(nextMinute);
    },
    [mode, onHourChange, onMinuteChange],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    selectedDuringGestureRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCapturing(true);
    setValueFromPointer(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setValueFromPointer(event);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setCapturing(false);
    if (mode === "hour" && selectedDuringGestureRef.current) {
      // pointerup 直後の click が新しい分ボタンに落ちないよう、次タスクで切り替える。
      modeSwitchTimerRef.current = window.setTimeout(() => {
        modeSwitchTimerRef.current = null;
        setMode("minute");
      }, 0);
      return;
    }
    if (mode === "minute" && selectedDuringGestureRef.current) {
      onMinuteCommit?.();
    }
  };

  const selectHour = (nextHour: number) => {
    onHourChange(nextHour);
    setMode("minute");
  };

  return (
    <div
      className={cn("mx-auto flex w-full max-w-70 flex-col gap-3", className)}
    >
      <p id={labelId} className="sr-only" aria-live="polite">
        {mode === "hour"
          ? "時。内側が1から12時、外側が13から0時です。時を選ぶと分の選択に切り替わります。"
          : "分。5分刻みです。"}
      </p>
      <div className="flex items-center justify-center gap-0.5 text-2xl font-medium tabular-nums">
        <button
          type="button"
          aria-pressed={mode === "hour"}
          aria-label="時を選ぶ"
          onClick={() => setMode("hour")}
          className={cn(
            "rounded-md px-1.5 py-0.5",
            mode === "hour"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {String(hour).padStart(2, "0")}
        </button>
        <span className="text-muted-foreground">:</span>
        <button
          type="button"
          aria-pressed={mode === "minute"}
          aria-label="分を選ぶ"
          onClick={() => setMode("minute")}
          className={cn(
            "rounded-md px-1.5 py-0.5",
            mode === "minute"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {String(selectedMinute).padStart(2, "0")}
        </button>
      </div>
      <div
        ref={rootRef}
        role="group"
        aria-labelledby={labelId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={cn(
          "relative aspect-square w-full select-none",
          capturing && "touch-none",
        )}
      >
        <svg
          viewBox={`0 0 ${ANALOG_CLOCK_SIZE} ${ANALOG_CLOCK_SIZE}`}
          className="text-border pointer-events-none size-full"
          aria-hidden
        >
          <circle
            cx={ANALOG_CLOCK_CENTER}
            cy={ANALOG_CLOCK_CENTER}
            r={136}
            className="fill-muted/50 stroke-border"
            strokeWidth={2}
          />
          {mode === "hour" ? (
            <circle
              cx={ANALOG_CLOCK_CENTER}
              cy={ANALOG_CLOCK_CENTER}
              r={96}
              className="fill-background/40 stroke-border/80"
              strokeWidth={1}
            />
          ) : null}
          {mode === "minute" ? (
            <ClockHand
              angle={minuteAngle}
              length={MINUTE_HAND_LENGTH}
              className="stroke-primary"
              width={4}
            />
          ) : (
            <ClockHand
              angle={hourAngle}
              length={hourLength}
              className="stroke-primary"
              width={4}
            />
          )}
          <circle
            cx={ANALOG_CLOCK_CENTER}
            cy={ANALOG_CLOCK_CENTER}
            r={6}
            className="fill-primary"
          />
        </svg>

        {mode === "hour"
          ? INNER_CLOCK_HOURS.map((label) => (
              <ClockNumberButton
                key={label}
                id={`${idPrefix}-hour-${label}`}
                ariaLabel={`${label}時`}
                selected={hour === label}
                radius={INNER_NUMBER_RADIUS}
                angleDegrees={clockLabelToAngleDegrees(label)}
                onSelect={() => selectHour(label)}
              >
                {label}
              </ClockNumberButton>
            ))
          : null}
        {mode === "hour"
          ? OUTER_CLOCK_HOURS.map((label) => (
              <ClockNumberButton
                key={label}
                id={`${idPrefix}-hour-${label}`}
                ariaLabel={`${label}時`}
                selected={hour === label}
                radius={OUTER_NUMBER_RADIUS}
                angleDegrees={clockLabelToAngleDegrees(label)}
                onSelect={() => selectHour(label)}
              >
                {label}
              </ClockNumberButton>
            ))
          : null}
        {mode === "minute"
          ? CLOCK_MINUTES.map((value) => (
              <ClockNumberButton
                key={value}
                id={`${idPrefix}-minute-${value}`}
                ariaLabel={`${String(value).padStart(2, "0")}分`}
                selected={selectedMinute === value}
                radius={CLOCK_MINUTE_RADIUS}
                angleDegrees={minuteHandAngleDegrees(value)}
                onSelect={() => {
                  onMinuteChange(value);
                  onMinuteCommit?.();
                }}
                className="size-8"
              >
                {String(value).padStart(2, "0")}
              </ClockNumberButton>
            ))
          : null}
      </div>
    </div>
  );
}

function ClockNumberButton({
  id,
  ariaLabel,
  selected,
  radius,
  angleDegrees,
  onSelect,
  className,
  children,
}: {
  id: string;
  ariaLabel: string;
  selected: boolean;
  radius: number;
  angleDegrees: number;
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}) {
  const stopFaceGesture = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };
  return (
    <button
      type="button"
      id={id}
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={stopFaceGesture}
      onPointerUp={stopFaceGesture}
      className={cn(
        "absolute z-10 flex size-7 items-center justify-center rounded-full text-xs font-medium tabular-nums",
        selected
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent",
        className,
      )}
      style={numberStyle(angleDegrees, radius)}
    >
      {children}
    </button>
  );
}
