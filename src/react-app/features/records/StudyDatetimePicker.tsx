/**
 * 学習日時の日付入力 + 24時間アナログ時計 + 分のドラムロール。
 */
import { useLayoutEffect, useRef } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import AnalogHourClock from "./AnalogHourClock";
import {
  formatRecordDatetime,
  isRecordDateString,
  MINUTE_DRUM_OPTIONS,
  notifyFormInput,
  nowRecordDatetimeParts,
  parseRecordDatetime,
  type RecordDatetimeParts,
} from "./recordFormUtils";

interface StudyDatetimePickerProps {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
}

export default function StudyDatetimePicker({
  idPrefix,
  value,
  onChange,
}: StudyDatetimePickerProps) {
  const parsed = parseRecordDatetime(value);
  const parts = parsed ?? nowRecordDatetimeParts();
  const fieldRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (parseRecordDatetime(value)) return;
    const next = nowRecordDatetimeParts();
    onChange(formatRecordDatetime(next.date, next.hour, next.minute));
    // 親の onChange は毎レンダー新しい参照になり得るため、value だけを同期トリガにする。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (next: RecordDatetimeParts) => {
    if (!isRecordDateString(next.date)) return;
    onChange(formatRecordDatetime(next.date, next.hour, next.minute));
    notifyFormInput(fieldRef.current);
  };

  return (
    <Field ref={fieldRef}>
      <FieldLabel htmlFor={`${idPrefix}-studyDate`}>学習日時</FieldLabel>
      <Input
        id={`${idPrefix}-studyDate`}
        type="date"
        required
        lang="ja"
        className="max-w-full min-w-0"
        value={parts.date}
        onChange={(event) => {
          if (!isRecordDateString(event.target.value)) return;
          emit({ ...parts, date: event.target.value });
        }}
      />
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        <AnalogHourClock
          idPrefix={idPrefix}
          hour={parts.hour}
          minute={parts.minute}
          onHourChange={(hour) => emit({ ...parts, hour })}
          className="min-w-0 flex-1"
        />
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-muted-foreground text-xs">分</span>
          <DrumRollPicker
            id={`${idPrefix}-minute`}
            aria-label="分"
            options={MINUTE_DRUM_OPTIONS}
            value={parts.minute}
            onChange={(minute) => emit({ ...parts, minute })}
            className="w-14"
          />
        </div>
      </div>
      <p className="text-foreground text-center text-sm tabular-nums">
        {String(parts.hour).padStart(2, "0")}:
        {String(parts.minute).padStart(2, "0")}
      </p>
      <FieldDescription>
        内側の円が1〜12時、外側の円が13〜24時です。24時は0時です。
      </FieldDescription>
    </Field>
  );
}
