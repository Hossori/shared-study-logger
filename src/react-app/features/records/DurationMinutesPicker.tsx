/**
 * 任意の学習時間（分）。トリガーをクリックすると加減算モーダルで 5 分刻みに調整する。
 */
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogButtonArea,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
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

export default function DurationMinutesPicker({
  idPrefix,
  value,
  onChange,
  open,
  onOpenChange,
}: DurationMinutesPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerId = `${idPrefix}-duration`;
  const dialogId = `${idPrefix}-duration-dialog`;
  const titleId = `${idPrefix}-duration-label`;

  const display = displayDuration(value);
  const atMin = value == null || value <= 0;
  const atMax = (value ?? 0) >= DURATION_MINUTES_MAX;

  const applyDelta = (delta: number) => {
    onChange(applyDurationMinutesDelta(value, delta));
    notifyFormInput(fieldRef.current);
  };

  const clear = () => {
    onChange(null);
    notifyFormInput(fieldRef.current);
  };

  return (
    <Field ref={fieldRef}>
      <FieldLabel id={titleId} htmlFor={triggerId}>
        学習時間
      </FieldLabel>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <PickerComboboxTrigger
          id={triggerId}
          open={open}
          onOpenChange={onOpenChange}
          aria-label="学習時間"
          aria-controls={dialogId}
          aria-haspopup="dialog"
          className="w-full"
        >
          {display}
        </PickerComboboxTrigger>
        <DialogContent id={dialogId} aria-labelledby={titleId}>
          <DialogHeader>
            <DialogTitle>学習時間</DialogTitle>
          </DialogHeader>

          <p className="text-center text-2xl font-medium tabular-nums">
            {display}
          </p>

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
          </div>

          <DialogButtonArea>
            <Button type="button" variant="outline" onClick={clear}>
              クリア
            </Button>
            <DialogClose render={<Button type="button" />}>OK</DialogClose>
          </DialogButtonArea>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
