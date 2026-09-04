/**
 * 学習記録フォームの日時変換・ペイロード組み立て（コンポーネント非依存）。
 */
import { DURATION_MINUTES_MAX } from "../../../../shared/schemas";
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

/** 現在時刻を datetime-local 用のローカル文字列で返す。 */
export function nowDatetimeLocalString(): string {
  return toDatetimeLocalString(new Date().toISOString());
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

/** 学習時間の加減算。未設定は 0 として計算し、0 以下は null、上限は MAX でクランプ。 */
export function applyDurationMinutesDelta(
  current: number | null,
  delta: number,
): number | null {
  const base = current ?? 0;
  const next = Math.min(Math.max(base + delta, 0), DURATION_MINUTES_MAX);
  return next <= 0 ? null : next;
}

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
    durationMinutes:
      values.durationMinutes == null || values.durationMinutes <= 0
        ? null
        : values.durationMinutes,
  };
}
