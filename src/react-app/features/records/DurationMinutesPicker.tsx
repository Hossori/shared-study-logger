/**
 * 任意の学習時間（分）を 10 分刻みのドラムロールで選ぶ。
 */
import { useRef } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import { DURATION_DRUM_OPTIONS, notifyFormInput } from "./recordFormUtils";

interface DurationMinutesPickerProps {
  idPrefix: string;
  value: number | null;
  onChange: (next: number | null) => void;
}

export default function DurationMinutesPicker({
  idPrefix,
  value,
  onChange,
}: DurationMinutesPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);

  return (
    <Field ref={fieldRef}>
      <FieldLabel htmlFor={`${idPrefix}-duration`}>学習時間（任意）</FieldLabel>
      <DrumRollPicker
        id={`${idPrefix}-duration`}
        aria-label="学習時間"
        options={DURATION_DRUM_OPTIONS}
        value={value}
        onChange={(next) => {
          onChange(next);
          notifyFormInput(fieldRef.current);
        }}
        className="mx-auto w-36"
      />
      <FieldDescription>
        単位は分です。10分刻みで選べます。未設定のまま投稿できます。
      </FieldDescription>
    </Field>
  );
}
