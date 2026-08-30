/**
 * 学習日時。日付と時刻を1行に並べ、時刻はアナログ時計のモーダルで選ぶ。
 */
import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogButtonArea,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AnalogClock from "./AnalogClock";
import PickerComboboxTrigger from "./PickerComboboxTrigger";
import {
  formatRecordDatetime,
  isRecordDateString,
  notifyFormInput,
  nowRecordDatetimeParts,
  parseRecordDatetime,
  type RecordDatetimeParts,
} from "./recordFormUtils";

interface StudyDatetimePickerProps {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimeLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function StudyDatetimePicker({
  idPrefix,
  value,
  onChange,
  open,
  onOpenChange,
}: StudyDatetimePickerProps) {
  const parsed = parseRecordDatetime(value);
  const parts = parsed ?? nowRecordDatetimeParts();
  const fieldRef = useRef<HTMLDivElement>(null);
  const clockId = `${idPrefix}-clock`;

  useLayoutEffect(() => {
    if (parseRecordDatetime(value)) return;
    const next = nowRecordDatetimeParts();
    onChange(formatRecordDatetime(next.date, next.hour, next.minute));
    // 親の onChange は毎レンダー新しい参照になり得るため、value だけを同期トリガにする。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (next: RecordDatetimeParts) => {
    if (!isRecordDateString(next.date)) return;
    const formatted = formatRecordDatetime(next.date, next.hour, next.minute);
    if (formatted === value) return;
    onChange(formatted);
    notifyFormInput(fieldRef.current);
  };

  return (
    <Field ref={fieldRef}>
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor={`${idPrefix}-studyDate`} className="shrink-0">
          学習日時
        </FieldLabel>
        <Input
          id={`${idPrefix}-studyDate`}
          type="date"
          required
          lang="ja"
          className="min-w-0 flex-1"
          value={parts.date}
          onChange={(event) => {
            if (!isRecordDateString(event.target.value)) return;
            emit({ ...parts, date: event.target.value });
          }}
        />
        <PickerComboboxTrigger
          id={`${idPrefix}-studyTime`}
          open={open}
          onOpenChange={onOpenChange}
          aria-label="時刻"
          aria-controls={clockId}
          aria-haspopup="dialog"
          className="w-auto shrink-0"
        >
          {formatTimeLabel(parts.hour, parts.minute)}
        </PickerComboboxTrigger>
      </div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          id={clockId}
          container={
            typeof document === "undefined" ? undefined : document.body
          }
        >
          <DialogHeader>
            <DialogTitle>時刻</DialogTitle>
            <DialogDescription>
              内側の円が1〜12時、外側の円が13〜24時です。時を選ぶと5分刻みの分に切り替わります。24時は0時です。
            </DialogDescription>
          </DialogHeader>
          <AnalogClock
            idPrefix={idPrefix}
            hour={parts.hour}
            minute={parts.minute}
            onHourChange={(hour) => emit({ ...parts, hour })}
            onMinuteChange={(minute) => emit({ ...parts, minute })}
          />
          <DialogButtonArea>
            <Button type="button" onClick={() => onOpenChange(false)}>
              完了
            </Button>
          </DialogButtonArea>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
