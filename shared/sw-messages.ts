/**
 * Service Worker (`public/sw.ts`) とフロント間の postMessage 契約。
 * SW は VitePWA injectManifest でバンドルされるため、ここから import できる。
 */

/** 通知タップ時に SW → クライアントへ送るメッセージ type */
export const NOTIFICATION_CLICK_MESSAGE_TYPE =
  "shared-study-logger:notification-click";
