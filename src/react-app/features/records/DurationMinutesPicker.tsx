/**
 * 任意の学習時間（分）。ラベルとコンボボックスを1行に並べ、タップでドラムロールを開く。
 */
import { useRef } from "react";
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";
import { DrumRollPicker } from "@/components/ui/drum-roll-picker";
import PickerComboboxTrigger from "./PickerComboboxTrigger";
import {
  DURATION_DRUM_OPTIONS,
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

export default function DurationMinutesPicker({
  idPrefix,
  value,
  onChange,
  open,
  onOpenChange,
}: DurationMinutesPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const titleId = `${idPrefix}-duration-label`;
  const listId = `${idPrefix}-duration`;

  return (
    <Field ref={fieldRef}>
      <div className="flex items-center gap-2">
        <FieldTitle id={titleId} className="shrink-0">
          学習時間（任意）
        </FieldTitle>
        <PickerComboboxTrigger
          id={`${idPrefix}-duration-trigger`}
          open={open}
          onOpenChange={onOpenChange}
          aria-label="学習時間"
          aria-controls={listId}
          aria-haspopup="listbox"
          className="w-auto min-w-0 flex-1"
        >
          {value == null ? "未設定" : formatDurationMinutes(value)}
        </PickerComboboxTrigger>
      </div>
      {open ? (
        <div className="flex flex-col gap-2">
          <DrumRollPicker
            id={listId}
            aria-labelledby={titleId}
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
        </div>
      ) : null}
    </Field>
  );
}
