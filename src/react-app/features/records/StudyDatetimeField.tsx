/**
 * 任意の学習日時。親フィールド + 「学習日時を設定」ネスト Dialog（ドラフト確定）。
 */
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Dialog,
  DialogButtonArea,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, CircleHelp, Clock, ClockPlus } from "lucide-react";
import { useRef, useState } from "react";
import { ja } from "react-day-picker/locale";
import { DURATION_MINUTES_MAX } from "../../../../shared/schemas";
import AnalogClock from "./AnalogClock";
import PickerComboboxTrigger from "./PickerComboboxTrigger";
import {
  addDurationToClock,
  clampDurationDraft,
  durationFromStartAndEndClock,
  formatClockTime,
  formatDurationMinutes,
  formatRecordDatetime,
  formatStudyDatetimeLabel,
  isRecordDateString,
  localDateToRecordDateString,
  notifyFormInput,
  nowRecordDatetimeParts,
  parseDatetimeLocalToIso,
  parseRecordDatetime,
  recordDateStringToLocalDate,
  STUDY_DURATION_HELP_TEXT,
} from "./recordFormUtils";

type OpenPicker = "date" | "start" | "end" | "durationHelp" | null;

interface StudyDatetimeFieldProps {
  idPrefix: string;
  startedAt: string;
  durationMinutes: number | null;
  onChange: (startedAt: string, durationMinutes: number | null) => void;
}

interface DraftState {
  date: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  endDisplayHour: number;
  endDisplayMinute: number;
  endClockHour: number;
  endClockMinute: number;
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

function formatDateTriggerLabel(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}/${month}/${day}`;
}

function endFromStartAndDuration(
  startHour: number,
  startMinute: number,
  durationMinutes: number,
): Pick<
  DraftState,
  "endDisplayHour" | "endDisplayMinute" | "endClockHour" | "endClockMinute"
> {
  const end = addDurationToClock(startHour, startMinute, durationMinutes);
  return {
    endDisplayHour: end.displayHour,
    endDisplayMinute: end.displayMinute,
    endClockHour: end.displayHour % 24,
    endClockMinute: end.displayMinute,
  };
}

function initDraft(
  startedAt: string,
  durationMinutes: number | null,
): DraftState {
  const parsed = parseRecordDatetime(startedAt);
  if (!parsed) {
    const today = nowRecordDatetimeParts();
    return {
      date: today.date,
      startHour: 0,
      startMinute: 0,
      durationMinutes: 0,
      ...endFromStartAndDuration(0, 0, 0),
    };
  }
  const duration = durationMinutes ?? 0;
  return {
    date: parsed.date,
    startHour: parsed.hour,
    startMinute: parsed.minute,
    durationMinutes: duration,
    ...endFromStartAndDuration(parsed.hour, parsed.minute, duration),
  };
}

function withEndFromDuration(
  state: DraftState,
  patch: Partial<DraftState>,
): DraftState {
  const merged = { ...state, ...patch };
  return {
    ...merged,
    ...endFromStartAndDuration(
      merged.startHour,
      merged.startMinute,
      merged.durationMinutes,
    ),
  };
}

function parentFieldLabel(
  startedAt: string,
  durationMinutes: number | null,
): string {
  if (!startedAt) return "学習日時を設定";
  const iso = parseDatetimeLocalToIso(startedAt);
  if (!iso) return "学習日時を設定";
  return formatStudyDatetimeLabel(iso, durationMinutes);
}

export default function StudyDatetimeField({
  idPrefix,
  startedAt,
  durationMinutes,
  onChange,
}: StudyDatetimeFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [draft, setDraft] = useState<DraftState>(() =>
    initDraft(startedAt, durationMinutes),
  );

  const dateTriggerId = `${idPrefix}-studyDate`;
  const datePickerId = `${idPrefix}-date-picker`;
  const startTriggerId = `${idPrefix}-startTime`;
  const startPickerId = `${idPrefix}-start-time-picker`;
  const endTriggerId = `${idPrefix}-endTime`;
  const endPickerId = `${idPrefix}-end-time-picker`;

  const togglePicker = (name: Exclude<OpenPicker, null>) => (open: boolean) => {
    setOpenPicker(open ? name : null);
  };

  const openDialog = () => {
    setDraft(initDraft(startedAt, durationMinutes));
    setOpenPicker(null);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setDraft(initDraft(startedAt, durationMinutes));
      setOpenPicker(null);
      setDialogOpen(true);
      return;
    }
    setOpenPicker(null);
    setDialogOpen(false);
  };

  const commitToParent = (
    nextStartedAt: string,
    nextDuration: number | null,
  ) => {
    onChange(nextStartedAt, nextDuration);
    notifyFormInput(fieldRef.current);
  };

  const handleOk = () => {
    if (!isRecordDateString(draft.date)) return;
    const formatted = formatRecordDatetime(
      draft.date,
      draft.startHour,
      draft.startMinute,
    );
    commitToParent(formatted, draft.durationMinutes);
    setDialogOpen(false);
  };

  const handleClear = () => {
    commitToParent("", null);
    setDialogOpen(false);
  };

  const timesReady = Boolean(draft.date);
  const okEnabled = timesReady && draft.durationMinutes >= 5;
  const atMinDuration = draft.durationMinutes <= 0;
  const atMaxDuration = draft.durationMinutes >= DURATION_MINUTES_MAX;
  const selectedDate = recordDateStringToLocalDate(draft.date);
  const durationPreview =
    draft.durationMinutes <= 0
      ? "0分"
      : formatDurationMinutes(draft.durationMinutes);

  return (
    <Field ref={fieldRef}>
      <div className="flex flex-col items-start gap-2">
        <FieldLabel>学習日時</FieldLabel>
        <Button
          type="button"
          variant="outline"
          className="inline-flex w-fit"
          onClick={openDialog}
        >
          <ClockPlus />
          {parentFieldLabel(startedAt, durationMinutes)}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-lg" overlay={{ forceRender: true }}>
          <DialogHeader>
            <DialogTitle>学習日時を設定</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,2.75fr)_minmax(0,0.5fr)_minmax(0,2.75fr)] gap-2 text-left text-sm">
              <span className="font-medium">学習日時</span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,2.75fr)_minmax(0,0.5fr)_minmax(0,2.75fr)] gap-2">
              <Popover
                open={openPicker === "date"}
                onOpenChange={togglePicker("date")}
                modal
              >
                <PopoverTrigger
                  render={
                    <PickerComboboxTrigger
                      id={dateTriggerId}
                      open={openPicker === "date"}
                      icon={CalendarIcon}
                      aria-label="学習日"
                      aria-controls={datePickerId}
                      aria-haspopup="dialog"
                      className="min-w-0"
                    >
                      {formatDateTriggerLabel(draft.date)}
                    </PickerComboboxTrigger>
                  }
                />
                <PopoverContent
                  id={datePickerId}
                  {...overlayPosition}
                  className="w-auto p-3"
                >
                  <PopoverTitle className="sr-only">学習日</PopoverTitle>
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
                      setDraft((current) => ({ ...current, date: nextDate }));
                      setOpenPicker(null);
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

              <Popover
                open={openPicker === "start"}
                onOpenChange={togglePicker("start")}
                modal
              >
                <PopoverTrigger
                  render={
                    <PickerComboboxTrigger
                      id={startTriggerId}
                      open={openPicker === "start"}
                      icon={Clock}
                      aria-label="開始時刻"
                      aria-controls={startPickerId}
                      aria-haspopup="dialog"
                      className="min-w-0"
                      disabled={!timesReady}
                    >
                      {formatClockTime(draft.startHour, draft.startMinute)}
                    </PickerComboboxTrigger>
                  }
                />
                <PopoverContent
                  id={startPickerId}
                  {...overlayPosition}
                  className="w-auto p-3"
                >
                  <PopoverTitle className="sr-only">開始時刻</PopoverTitle>
                  <AnalogClock
                    idPrefix={`${idPrefix}-start`}
                    hour={draft.startHour}
                    minute={draft.startMinute}
                    onHourChange={(hour) =>
                      setDraft((current) =>
                        withEndFromDuration(current, { startHour: hour }),
                      )
                    }
                    onMinuteChange={(minute) =>
                      setDraft((current) =>
                        withEndFromDuration(current, { startMinute: minute }),
                      )
                    }
                    onMinuteCommit={() => setOpenPicker(null)}
                  />
                </PopoverContent>
              </Popover>

              <span className="flex items-center justify-center text-sm">
                ～
              </span>

              <Popover
                open={openPicker === "end"}
                onOpenChange={togglePicker("end")}
                modal
              >
                <PopoverTrigger
                  render={
                    <PickerComboboxTrigger
                      id={endTriggerId}
                      open={openPicker === "end"}
                      icon={Clock}
                      aria-label="終了時刻"
                      aria-controls={endPickerId}
                      aria-haspopup="dialog"
                      className="min-w-0"
                      disabled={!timesReady}
                    >
                      {formatClockTime(
                        draft.endDisplayHour,
                        draft.endDisplayMinute,
                      )}
                    </PickerComboboxTrigger>
                  }
                />
                <PopoverContent
                  id={endPickerId}
                  {...overlayPosition}
                  className="w-auto p-3"
                >
                  <PopoverTitle className="sr-only">終了時刻</PopoverTitle>
                  <AnalogClock
                    idPrefix={`${idPrefix}-end`}
                    hour={draft.endClockHour}
                    minute={draft.endClockMinute}
                    onHourChange={(hour) => {
                      const duration = durationFromStartAndEndClock(
                        draft.startHour,
                        draft.startMinute,
                        hour,
                        draft.endClockMinute,
                      );
                      setDraft((current) =>
                        withEndFromDuration(current, {
                          durationMinutes: duration,
                        }),
                      );
                    }}
                    onMinuteChange={(minute) => {
                      const duration = durationFromStartAndEndClock(
                        draft.startHour,
                        draft.startMinute,
                        draft.endClockHour,
                        minute,
                      );
                      setDraft((current) =>
                        withEndFromDuration(current, {
                          durationMinutes: duration,
                        }),
                      );
                    }}
                    onMinuteCommit={() => setOpenPicker(null)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <p className="text-sm font-medium">
                学習時間
                <Popover
                  open={openPicker === "durationHelp"}
                  onOpenChange={togglePicker("durationHelp")}
                >
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="学習時間のヘルプ"
                        aria-expanded={openPicker === "durationHelp"}
                        aria-controls={`${idPrefix}-duration-help`}
                      >
                        <CircleHelp className="text-muted-foreground" />
                        <span className="sr-only">学習時間のヘルプ</span>
                      </Button>
                    }
                  />
                  <PopoverContent
                    id={`${idPrefix}-duration-help`}
                    side="bottom"
                    align="start"
                    className="w-auto max-w-xs p-2"
                  >
                    <PopoverTitle className="sr-only">
                      学習時間のヘルプ
                    </PopoverTitle>
                    <p>{STUDY_DURATION_HELP_TEXT}</p>
                  </PopoverContent>
                </Popover>
              </p>
              <p className="text-sm tabular-nums">{durationPreview}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DELTA_BUTTONS.map(({ label, delta }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  disabled={
                    !timesReady || (delta > 0 ? atMaxDuration : atMinDuration)
                  }
                  onClick={() =>
                    setDraft((current) =>
                      withEndFromDuration(current, {
                        durationMinutes: clampDurationDraft(
                          current.durationMinutes,
                          delta,
                        ),
                      }),
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <DialogButtonArea>
            <Button type="button" variant="outline" onClick={handleClear}>
              クリア
            </Button>
            <Button type="button" disabled={!okEnabled} onClick={handleOk}>
              OK
            </Button>
          </DialogButtonArea>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
