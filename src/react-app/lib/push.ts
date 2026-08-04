/**
 * Web Push関連のヘルパー関数。
 */

/** base64url文字列をVAPID公開鍵として`applicationServerKey`に渡せる`Uint8Array`に変換する。 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

/** iOS Safari（ホーム画面未追加）かどうかを判定する。 */
export function isIosNonStandalone(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as NavigatorStandalone).standalone === true;
  return isIos && !isStandalone;
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
