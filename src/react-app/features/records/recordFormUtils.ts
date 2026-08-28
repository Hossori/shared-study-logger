/**
 * 学習記録フォームの日時変換・ペイロード組み立て（コンポーネント非依存）。
 */
import {
  DURATION_MINUTES_MAX,
  DURATION_MINUTES_MIN,
  DURATION_MINUTES_STEP,
} from "../../../../shared/schemas";

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

/** datetime-local 入力値を ISO 文字列に変換。不正なら null。 */
export function parseDatetimeLocalToIso(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  const parsed = new Date(datetimeLocal);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** ISO 日時を datetime-local 用のローカル文字列に変換。 */
export function toDatetimeLocalString(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

/** 現在時刻を datetime-local 用のローカル文字列で返す。 */
export function nowDatetimeLocalString(): string {
  return toDatetimeLocalString(new Date().toISOString());
}

export function nowRecordDatetimeParts(): RecordDatetimeParts {
  const now = new Date();
  return {
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

export function isRecordDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
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

export function durationMinuteValues(): number[] {
  const values: number[] = [];
  for (
    let minutes = DURATION_MINUTES_MIN;
    minutes <= DURATION_MINUTES_MAX;
    minutes += DURATION_MINUTES_STEP
  ) {
    values.push(minutes);
  }
  return values;
}

export const MINUTE_DRUM_OPTIONS: { value: number; label: string }[] =
  Array.from({ length: 60 }, (_, minute) => ({
    value: minute,
    label: String(minute).padStart(2, "0"),
  }));

export const DURATION_DRUM_OPTIONS: { value: number | null; label: string }[] =
  [
    { value: null, label: "未設定" },
    ...durationMinuteValues().map((minutes) => ({
      value: minutes,
      label: formatDurationMinutes(minutes),
    })),
  ];

/** 未保存ガードが拾えるよう、フォームへ input イベントをバブリングする。 */
export function notifyFormInput(node: EventTarget | null): void {
  node?.dispatchEvent(new Event("input", { bubbles: true }));
}

/** フォーム値から API 用ペイロードを組み立てる。不正なら null。 */
export function buildRecordRequestPayload(values: RecordFormValues): {
  studyDatetime: string;
  title: string;
  memo: string | undefined;
  durationMinutes: number | null;
} | null {
  const studyDatetime = parseDatetimeLocalToIso(values.studyDatetime);
  const title = values.title.trim();
  if (!parseRecordDatetime(values.studyDatetime) || !studyDatetime || !title) {
    return null;
  }
  const memo = values.memo.trim();
  return {
    studyDatetime,
    title,
    memo: memo ? memo : undefined,
    durationMinutes: values.durationMinutes,
  };
}
