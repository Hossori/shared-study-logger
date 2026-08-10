/**
 * 学習記録フォームの日時変換・ペイロード組み立て（コンポーネント非依存）。
 */
import type { RecordFormValues } from "./RecordFormFields";

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

/** フォーム値から API 用ペイロードを組み立てる。不正なら null。 */
export function buildRecordRequestPayload(values: RecordFormValues): {
  studyDatetime: string;
  title: string;
  memo: string | undefined;
} | null {
  const studyDatetime = parseDatetimeLocalToIso(values.studyDatetime);
  const title = values.title.trim();
  if (!studyDatetime || !title) return null;
  const memo = values.memo.trim();
  return {
    studyDatetime,
    title,
    memo: memo ? memo : undefined,
  };
}
