/**
 * Web Push のブラウザ側ヘルパー。
 */

export { urlBase64ToUint8Array } from "@shared/web-push";

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
