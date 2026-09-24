/**
 * iOS 非スタンドアロン（ホーム画面未追加）かどうか。
 * Safari / Chrome / Firefox / Edge など iOS ブラウザ共通。PWA 案内と Push 購読の両方が使う。
 */
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export function isIosNonStandalone(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as NavigatorStandalone).standalone === true;
  return isIos && !isStandalone;
}
