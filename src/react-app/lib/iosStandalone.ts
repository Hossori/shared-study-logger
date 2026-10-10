/**
 * iOS 非スタンドアロン（ホーム画面未追加）かどうか。
 * Safari / Chrome / Firefox / Edge など iOS ブラウザ共通。PWA 案内と Push 購読の両方が使う。
 */
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

function isIosDevice(userAgent: string): boolean {
  if (/iphone|ipad|ipod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
}

export function isIosNonStandalone(): boolean {
  const isIos = isIosDevice(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as NavigatorStandalone).standalone === true;
  return isIos && !isStandalone;
}
