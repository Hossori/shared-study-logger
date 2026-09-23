/**
 * PWA インストール可否・スタンドアロン起動の判定ヘルパー。
 * `beforeinstallprompt` の型と、iOS の「ホーム画面に追加」案内条件を集約する。
 */
import { isIosNonStandalone } from "./push";

/** Chromium 系が発火するインストール前イベント。 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
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
