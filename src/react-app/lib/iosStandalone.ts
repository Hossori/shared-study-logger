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

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as NavigatorStandalone).standalone === true
  );
}

export function isIosClient(): boolean {
  return isIosDevice(navigator.userAgent);
}

export function isIosNonStandalone(): boolean {
  return isIosDevice(navigator.userAgent) && !isStandaloneDisplay();
}
