/**
 * 学習日時。日付と時刻を横並びのコンボにし、それぞれカレンダー／アナログ時計のオーバーレイで選ぶ。
 */
import { useLayoutEffect, useRef } from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { ja } from "react-day-picker/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import AnalogClock from "./AnalogClock";
import PickerComboboxTrigger from "./PickerComboboxTrigger";
import {
  formatRecordDatetime,
  isRecordDateString,
  localDateToRecordDateString,
  notifyFormInput,
  nowRecordDatetimeParts,
  parseRecordDatetime,
  recordDateStringToLocalDate,
  type RecordDatetimeParts,
} from "./recordFormUtils";

interface StudyDatetimePickerProps {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
  dateOpen: boolean;
  onDateOpenChange: (open: boolean) => void;
  timeOpen: boolean;
  onTimeOpenChange: (open: boolean) => void;
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}/${month}/${day}`;
}

function formatTimeLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const overlayPosition = {
  align: "start" as const,
  side: "bottom" as const,
  positionMethod: "fixed" as const,
  collisionAvoidance: { side: "shift" as const, align: "shift" as const },
};

export default function StudyDatetimePicker({
  idPrefix,
  value,
  onChange,
  dateOpen,
  onDateOpenChange,
  timeOpen,
  onTimeOpenChange,
}: StudyDatetimePickerProps) {
  const parsed = parseRecordDatetime(value);
  const parts = parsed ?? nowRecordDatetimeParts();
  const fieldRef = useRef<HTMLDivElement>(null);
  const dateTriggerId = `${idPrefix}-studyDate`;
  const timeTriggerId = `${idPrefix}-studyTime`;
  const datePickerId = `${idPrefix}-date-picker`;
  const timePickerId = `${idPrefix}-time-picker`;
  const selectedDate = recordDateStringToLocalDate(parts.date);

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
      <FieldLabel htmlFor={dateTriggerId} className="required shrink-0">
        学習日時
      </FieldLabel>
      <div className="flex items-center gap-2">
        <Popover open={dateOpen} onOpenChange={onDateOpenChange} modal>
          <PopoverTrigger
            render={
              <PickerComboboxTrigger
                id={dateTriggerId}
                open={dateOpen}
                icon={CalendarIcon}
                aria-label="日付"
                aria-controls={datePickerId}
                aria-haspopup="dialog"
                className="min-w-0 flex-3"
              >
                {formatDateLabel(parts.date)}
              </PickerComboboxTrigger>
            }
          />
          <PopoverContent
            id={datePickerId}
            {...overlayPosition}
            className="w-auto p-3"
          >
            <PopoverTitle className="sr-only">日付</PopoverTitle>
            <Calendar
              mode="single"
              locale={ja}
              required
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                const nextDate = localDateToRecordDateString(date);
                if (!isRecordDateString(nextDate)) return;
                emit({ ...parts, date: nextDate });
                onDateOpenChange(false);
              }}
              components={{
                DayButton: (buttonProps) => (
                  <CalendarDayButton
                    {...buttonProps}
                    locale={ja}
                    id={`${idPrefix}-date-${localDateToRecordDateString(buttonProps.day.date)}`}
                  />
                ),
              }}
            />
          </PopoverContent>
        </Popover>
        <Popover open={timeOpen} onOpenChange={onTimeOpenChange} modal>
          <PopoverTrigger
            render={
              <PickerComboboxTrigger
                id={timeTriggerId}
                open={timeOpen}
                icon={ClockIcon}
                aria-label="時刻"
                aria-controls={timePickerId}
                aria-haspopup="dialog"
                className="min-w-0 flex-2"
              >
                {formatTimeLabel(parts.hour, parts.minute)}
              </PickerComboboxTrigger>
            }
          />
          <PopoverContent
            id={timePickerId}
            {...overlayPosition}
            className="w-auto p-3"
          >
            <PopoverTitle className="sr-only">時刻</PopoverTitle>
            <AnalogClock
              idPrefix={idPrefix}
              hour={parts.hour}
              minute={parts.minute}
              onHourChange={(hour) => emit({ ...parts, hour })}
              onMinuteChange={(minute) => emit({ ...parts, minute })}
              onMinuteCommit={() => onTimeOpenChange(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </Field>
  );
}
