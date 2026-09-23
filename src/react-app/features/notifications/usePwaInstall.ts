/**
 * PWA インストール案内用フック。
 * - Chromium: beforeinstallprompt を保持し、ユーザー操作で prompt()
 * - iOS Safari（非スタンドアロン）: 手順案内のみ（ネイティブ prompt なし）
 */
import { useCallback, useEffect, useState } from "react";
import { isIosNonStandalone } from "../../lib/push";
import {
  isStandaloneDisplay,
  needsPwaInstallGuidance,
  type BeforeInstallPromptEvent,
} from "../../lib/pwaInstall";

export interface PwaInstallController {
  /** 案内を出すべきか（スタンドアロン起動中は false） */
  shouldGuide: boolean;
  /** iOS の共有メニュー案内が必要か */
  isIosGuide: boolean;
  /** Chromium のインストールダイアログを出せるか */
  canPromptInstall: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export function usePwaInstall(): PwaInstallController {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  /** BIP を一度でも受け取ったか。prompt 消費後も案内を残すために使う。 */
  const [hadInstallPrompt, setHadInstallPrompt] = useState(false);
  const [standalone, setStandalone] = useState(() =>
    typeof window === "undefined" ? false : isStandaloneDisplay(),
  );

  useEffect(() => {
    const syncStandalone = () => setStandalone(isStandaloneDisplay());
    syncStandalone();

    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", syncStandalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setHadInstallPrompt(true);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setHadInstallPrompt(false);
      setStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media?.removeEventListener?.("change", syncStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome;
  }, [deferredPrompt]);

  const isIosGuide = !standalone && isIosNonStandalone();

  return {
    shouldGuide:
      !standalone && needsPwaInstallGuidance(deferredPrompt, hadInstallPrompt),
    isIosGuide,
    canPromptInstall: deferredPrompt != null,
    promptInstall,
  };
}
