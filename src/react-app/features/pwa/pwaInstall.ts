/**
 * PWA インストール可否・スタンドアロン起動の判定ヘルパー。
 * `beforeinstallprompt` の型と、iOS 各ブラウザの「ホーム画面に追加」案内条件を集約する。
 */
import { isIosNonStandalone } from "@/lib/iosStandalone";

/** Chromium 系が発火するインストール前イベント。 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/** iOS の手動インストール案内。CriOS / FxiOS / EdgiOS を Safari より先に見る（UA に Safari も含まれる）。 */
export function iosHomeScreenInstallHint(userAgent: string): string {
  if (/CriOS/i.test(userAgent)) {
    return "Chrome の共有ボタン →「ホーム画面に追加」";
  }
  if (/FxiOS/i.test(userAgent)) {
    return "Firefox の共有ボタン →「ホーム画面に追加」";
  }
  if (/EdgiOS/i.test(userAgent)) {
    return "Edge の共有ボタン →「ホーム画面に追加」";
  }
  if (/Safari/i.test(userAgent) && !/Chrome|Chromium/i.test(userAgent)) {
    return "Safari の共有ボタン →「ホーム画面に追加」";
  }
  return "ブラウザの共有ボタン →「ホーム画面に追加」";
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * カスタム UI で案内すべき PWA インストール案内があるか。
 * Chromium は `prompt()` 後に deferred が消えても、同一セッションでは案内を残す
 * （`hadInstallPrompt`）— BIP は再発火しないことが多いため。
 */
export function needsPwaInstallGuidance(
  deferredPrompt: BeforeInstallPromptEvent | null,
  hadInstallPrompt = false,
): boolean {
  if (isStandaloneDisplay()) return false;
  if (isIosNonStandalone()) return true;
  return deferredPrompt != null || hadInstallPrompt;
}
