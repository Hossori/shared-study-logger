/**
 * Service Worker (`public/sw.ts`) とフロント間の postMessage 契約。
 * SW は VitePWA injectManifest でバンドルされるため、ここから import できる。
 */

/** 通知タップ時に SW → クライアントへ送るメッセージ type */
export const NOTIFICATION_CLICK_MESSAGE_TYPE =
  "shared-study-logger:notification-click";

/** クライアントが待機中の Service Worker に有効化を依頼するメッセージ type */
export const SKIP_WAITING_MESSAGE_TYPE = "shared-study-logger:skip-waiting";

export interface SkipWaitingMessage {
  type: typeof SKIP_WAITING_MESSAGE_TYPE;
}

/** 未信頼の postMessage payload が有効化要求かを安全に判定する。 */
export function isSkipWaitingMessage(
  message: unknown,
): message is SkipWaitingMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === SKIP_WAITING_MESSAGE_TYPE
  );
}
