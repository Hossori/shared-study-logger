/**
 * 学習記録フォームの日時変換・ペイロード組み立て（コンポーネント非依存）。
 */
import { DURATION_MINUTES_MAX } from "../../../../shared/schemas";
import type { StudyRecord } from "../../../../shared/schemas";
import { applyClockMinuteSnap } from "./analogClockUtils";

export interface RecordFormValues {
  studyDatetime: string;
  title: string;
  memo: string;
  durationMinutes: number | null;
}

export interface RecordDatetimeParts {
  date: string;
  hour: number;
  minute: number;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** datetime-local 入力値を ISO 文字列に変換。不正なら null。 */
export function parseDatetimeLocalToIso(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  const parsed = new Date(datetimeLocal);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function partsFromDate(date: Date): RecordDatetimeParts {
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

/** ISO 日時を datetime-local 用のローカル文字列に変換。分は 5 分刻み。 */
export function toDatetimeLocalString(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const snapped = applyClockMinuteSnap(date);
  const parts = partsFromDate(snapped);
  return formatRecordDatetime(parts.date, parts.hour, parts.minute);
}

export function nowRecordDatetimeParts(): RecordDatetimeParts {
  return partsFromDate(applyClockMinuteSnap(new Date()));
}

export function isRecordDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/** YYYY-MM-DD をローカル日付に変換（UTC ずれを避ける）。 */
export function recordDateStringToLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** ローカル日付を YYYY-MM-DD に変換。 */
export function localDateToRecordDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseRecordDatetime(
  datetimeLocal: string,
): RecordDatetimeParts | null {
  if (!datetimeLocal) return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(datetimeLocal);
  if (!match) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  if (
    !isRecordDateString(match[1]) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { date: match[1], hour, minute };
}

export function formatRecordDatetime(
  date: string,
  hour: number,
  minute: number,
): string {
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
}

/** 時刻表示（時はゼロ埋めなし、分は 2 桁）。 */
export function formatClockTime(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

/** 日付 + 曜日（例: 2026年12月28日(月)）。 */
export function formatJaDateWithWeekday(date: Date): string {
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekday})`;
}

export interface ClockEndDisplay {
  displayHour: number;
  displayMinute: number;
}

/** 開始時刻 + 学習時間から終了時刻（24h オーバーフロー表示）を算出。 */
export function addDurationToClock(
  startHour: number,
  startMinute: number,
  durationMinutes: number,
): ClockEndDisplay {
  const endAbsoluteMin = startHour * 60 + startMinute + durationMinutes;
  return {
    displayHour: Math.floor(endAbsoluteMin / 60),
    displayMinute: endAbsoluteMin % 60,
  };
}

/** 開始・終了時計（0–23）から学習時間（分）を算出。 */
export function durationFromStartAndEndClock(
  startH: number,
  startM: number,
  endClockH: number,
  endClockM: number,
): number {
  if (startH === endClockH && startM === endClockM) return 0;
  const startMin = startH * 60 + startM;
  let endMin = endClockH * 60 + endClockM;
  if (endMin < startMin) endMin += 24 * 60;
  const duration = endMin - startMin;
  return Math.min(duration, DURATION_MINUTES_MAX);
}

export const STUDY_DURATION_HELP_TEXT = "学習日時の終了時刻と連動します";

/** 学習時間ドラフトの加減算（0..MAX、0 は null にしない）。 */
export function clampDurationDraft(current: number, delta: number): number {
  return Math.min(Math.max(current + delta, 0), DURATION_MINUTES_MAX);
}

/** 一覧・フォーム用の学習日時ラベル。 */
export function formatStudyDatetimeLabel(
  iso: string,
  durationMinutes: number | null,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = formatJaDateWithWeekday(date);
  const startPart = formatClockTime(date.getHours(), date.getMinutes());
  if (durationMinutes == null || durationMinutes <= 0) {
    return `${datePart} ${startPart}`;
  }
  const end = addDurationToClock(
    date.getHours(),
    date.getMinutes(),
    durationMinutes,
  );
  const endPart = formatClockTime(end.displayHour, end.displayMinute);
  return `${datePart} ${startPart}-${endPart}`;
}

/** 記録カードの日時表示。 */
export function formatRecordCardDatetime(record: StudyRecord): string {
  if (record.studyDatetime) {
    return formatStudyDatetimeLabel(
      record.studyDatetime,
      record.durationMinutes,
    );
  }
  const created = new Date(record.createdAt);
  if (Number.isNaN(created.getTime())) return record.createdAt;
  return `${formatJaDateWithWeekday(created)} ${formatClockTime(created.getHours(), created.getMinutes())}`;
}

/** 学習時間バッジを表示するか（学習日時と duration の両方が正の値）。 */
export function shouldShowDurationBadge(record: StudyRecord): boolean {
  return (
    record.studyDatetime != null &&
    record.durationMinutes != null &&
    record.durationMinutes > 0
  );
}

/** 未保存ガードが拾えるよう、フォームへ input イベントをバブリングする。 */
export function notifyFormInput(node: EventTarget | null): void {
  node?.dispatchEvent(new Event("input", { bubbles: true }));
}

/** フォーム値から API 用ペイロードを組み立てる。不正なら null。 */
export function buildRecordRequestPayload(values: RecordFormValues): {
  studyDatetime: string | null;
  title: string;
  memo: string | undefined;
  durationMinutes: number | null;
} | null {
  const title = values.title.trim();
  if (!title) return null;

  const memo = values.memo.trim();
  const memoField = memo ? memo : undefined;

  if (!values.studyDatetime) {
    return {
      studyDatetime: null,
      title,
      memo: memoField,
      durationMinutes: null,
    };
  }

  const studyDatetime = parseDatetimeLocalToIso(values.studyDatetime);
  if (!parseRecordDatetime(values.studyDatetime) || !studyDatetime) {
    return null;
  }

  return {
    studyDatetime,
    title,
    memo: memoField,
    durationMinutes:
      values.durationMinutes == null || values.durationMinutes <= 0
        ? null
        : values.durationMinutes,
  };
}
