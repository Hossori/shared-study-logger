/**
 * iOS のホーム画面 PWA では、画面端スワイプが履歴の進む・戻るになる。
 * POP をキャンセルして今の画面に留め、Link などの PUSH はそのまま通す。
 * WebKit がジェスチャの描画自体を出すことは残る。
 */
import { useEffect, useLayoutEffect } from "react";
import { Outlet, useBlocker } from "react-router";
import { shouldBlockIosStandalonePop } from "@/lib/iosStandalone";

export default function IosStandaloneHistoryLock() {
  const blocker = useBlocker(({ historyAction }) =>
    shouldBlockIosStandalonePop(historyAction),
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  useLayoutEffect(() => {
    if (!shouldBlockIosStandalonePop("POP")) return;
    document.documentElement.dataset.iosStandalone = "";
    return () => {
      delete document.documentElement.dataset.iosStandalone;
    };
  }, []);

  return <Outlet />;
}
