/**
 * 内側 1〜12 時・外側 13〜24 時のアナログ時計。時針の長さで内外を表す。
 */
import {
  useCallback,
  useId,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import {
  ANALOG_CLOCK_CENTER,
  ANALOG_CLOCK_SIZE,
  INNER_CLOCK_HOURS,
  INNER_NUMBER_RADIUS,
  MINUTE_HAND_LENGTH,
  OUTER_CLOCK_HOURS,
  OUTER_NUMBER_RADIUS,
  clockLabelToAngleDegrees,
  clockLabelToHour,
  hourHandAngleDegrees,
  hourHandLength,
  hourLabelFromPointer,
  hourToClockLabel,
  minuteHandAngleDegrees,
  polarToCartesian,
} from "./analogClockUtils";

interface AnalogHourClockProps {
  idPrefix: string;
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  className?: string;
}

function numberStyle(label: number, radius: number): CSSProperties {
  const { x, y } = polarToCartesian(
    ANALOG_CLOCK_CENTER,
    ANALOG_CLOCK_CENTER,
    radius,
    clockLabelToAngleDegrees(label),
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

export default function AnalogHourClock({
  idPrefix,
  hour,
  minute,
  onHourChange,
  className,
}: AnalogHourClockProps) {
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = hourToClockLabel(hour);
  const hourAngle = hourHandAngleDegrees(hour, minute);
  const minuteAngle = minuteHandAngleDegrees(minute);
  const hourLength = hourHandLength(selectedLabel);

  const setHourFromPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * ANALOG_CLOCK_SIZE;
      const y = ((event.clientY - rect.top) / rect.height) * ANALOG_CLOCK_SIZE;
      const label = hourLabelFromPointer(x, y);
      if (label == null) return;
      onHourChange(clockLabelToHour(label));
    },
    [onHourChange],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setHourFromPointer(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setHourFromPointer(event);
  };

  return (
    <div className={cn("mx-auto w-full max-w-[17.5rem]", className)}>
      <p id={labelId} className="sr-only">
        時刻。内側が1から12時、外側が13から24時です。
      </p>
      <div
        ref={rootRef}
        role="group"
        aria-labelledby={labelId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative aspect-square w-full touch-none select-none"
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
          <circle
            cx={ANALOG_CLOCK_CENTER}
            cy={ANALOG_CLOCK_CENTER}
            r={96}
            className="fill-background/40 stroke-border/80"
            strokeWidth={1}
          />
          {Array.from({ length: 60 }, (_, index) => {
            const angle = index * 6;
            const outer = polarToCartesian(
              ANALOG_CLOCK_CENTER,
              ANALOG_CLOCK_CENTER,
              132,
              angle,
            );
            const inner = polarToCartesian(
              ANALOG_CLOCK_CENTER,
              ANALOG_CLOCK_CENTER,
              index % 5 === 0 ? 124 : 128,
              angle,
            );
            return (
              <line
                key={index}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                className="stroke-muted-foreground/70"
                strokeWidth={index % 5 === 0 ? 2 : 1}
              />
            );
          })}
          <ClockHand
            angle={minuteAngle}
            length={MINUTE_HAND_LENGTH}
            className="stroke-muted-foreground"
            width={2}
          />
          <ClockHand
            angle={hourAngle}
            length={hourLength}
            className="stroke-primary"
            width={4}
          />
          <circle
            cx={ANALOG_CLOCK_CENTER}
            cy={ANALOG_CLOCK_CENTER}
            r={6}
            className="fill-primary"
          />
        </svg>

        {INNER_CLOCK_HOURS.map((label) => (
          <HourNumberButton
            key={label}
            idPrefix={idPrefix}
            label={label}
            selected={selectedLabel === label}
            radius={INNER_NUMBER_RADIUS}
            onSelect={onHourChange}
          />
        ))}
        {OUTER_CLOCK_HOURS.map((label) => (
          <HourNumberButton
            key={label}
            idPrefix={idPrefix}
            label={label}
            selected={selectedLabel === label}
            radius={OUTER_NUMBER_RADIUS}
            onSelect={onHourChange}
          />
        ))}
      </div>
    </div>
  );
}

function HourNumberButton({
  idPrefix,
  label,
  selected,
  radius,
  onSelect,
}: {
  idPrefix: string;
  label: number;
  selected: boolean;
  radius: number;
  onSelect: (hour: number) => void;
}) {
  return (
    <button
      type="button"
      id={`${idPrefix}-hour-${label}`}
      aria-label={`${label}時`}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(clockLabelToHour(label));
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "absolute z-10 flex size-7 items-center justify-center rounded-full text-xs font-medium",
        selected
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent",
      )}
      style={numberStyle(label, radius)}
    >
      {label}
    </button>
  );
}
