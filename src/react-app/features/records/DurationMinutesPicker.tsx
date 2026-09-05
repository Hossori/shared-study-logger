/**
 * 任意の学習時間（分）。トリガー直下のポップアップで 5 分刻みに加減算する。
 */
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DURATION_MINUTES_MAX } from "../../../../shared/schemas";
import PickerComboboxTrigger from "./PickerComboboxTrigger";
import {
  applyDurationMinutesDelta,
  formatDurationMinutes,
  notifyFormInput,
} from "./recordFormUtils";

interface DurationMinutesPickerProps {
  idPrefix: string;
  value: number | null;
  onChange: (next: number | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function displayDuration(value: number | null): string {
  return value == null || value <= 0 ? "未設定" : formatDurationMinutes(value);
}

const DELTA_BUTTONS: { label: string; delta: number }[] = [
  { label: "+1時間", delta: 60 },
  { label: "-1時間", delta: -60 },
  { label: "+10分", delta: 10 },
  { label: "-10分", delta: -10 },
  { label: "+5分", delta: 5 },
  { label: "-5分", delta: -5 },
];

const overlayPosition = {
  align: "start" as const,
  side: "bottom" as const,
  positionMethod: "fixed" as const,
  collisionAvoidance: { side: "shift" as const, align: "shift" as const },
};

export default function DurationMinutesPicker({
  idPrefix,
  value,
  onChange,
  open,
  onOpenChange,
}: DurationMinutesPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerId = `${idPrefix}-duration`;
  const pickerId = `${idPrefix}-duration-picker`;
  const titleId = `${idPrefix}-duration-label`;

  const display = displayDuration(value);
  const atMin = value == null || value <= 0;
  const atMax = (value ?? 0) >= DURATION_MINUTES_MAX;

  const applyDelta = (delta: number) => {
    onChange(applyDurationMinutesDelta(value, delta));
    notifyFormInput(fieldRef.current);
  };

  return (
    <Field ref={fieldRef}>
      <FieldLabel id={titleId} htmlFor={triggerId}>
        学習時間
      </FieldLabel>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <PickerComboboxTrigger
              id={triggerId}
              open={open}
              aria-label="学習時間"
              aria-controls={pickerId}
              aria-haspopup="dialog"
              className="w-full"
            >
              {display}
            </PickerComboboxTrigger>
          }
        />
        <PopoverContent
          id={pickerId}
          aria-labelledby={titleId}
          className="w-(--anchor-width)"
          {...overlayPosition}
        >
          <PopoverTitle className="sr-only">学習時間</PopoverTitle>
          <div className="grid grid-cols-2 gap-2">
            {DELTA_BUTTONS.map(({ label, delta }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                disabled={delta > 0 ? atMax : atMin}
                onClick={() => applyDelta(delta)}
              >
                {label}
              </Button>
            ))}
            <Button
              className="col-start-2"
              type="button"
              disabled={atMin}
              onClick={() => onChange(null)}
            >
              クリア
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
