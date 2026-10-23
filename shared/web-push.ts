/**
 * Web Push 向けの共有ユーティリティ（フロントと Service Worker の両方から import 可能）。
 */

/** base64url 文字列を VAPID 公開鍵として `applicationServerKey` に渡せる `Uint8Array` に変換する。 */
export function urlBase64ToUint8Array(
  base64Url: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface NormalizedPushPayload {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/** Push イベントの JSON ペイロードを通知表示用に正規化する。 */
export function normalizePushPayload(
  raw: unknown,
  defaultTitle: string,
): NormalizedPushPayload {
  if (typeof raw !== "object" || raw === null) {
    return { title: defaultTitle };
  }

  const record = raw as Record<string, unknown>;
  const title =
    typeof record.title === "string" && record.title.length > 0
      ? record.title
      : defaultTitle;

  const payload: NormalizedPushPayload = { title };

  if (typeof record.body === "string") {
    payload.body = record.body;
  }

  if (
    typeof record.data === "object" &&
    record.data !== null &&
    !Array.isArray(record.data)
  ) {
    payload.data = record.data as Record<string, unknown>;
  }

  return payload;
}
