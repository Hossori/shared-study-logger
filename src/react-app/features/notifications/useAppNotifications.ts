/**
 * アプリ内通知リストをソースから組み立てる。
 * 現状はクライアントローカル（PWA 案内・Push オプトイン）のみ。
 * サーバー通知 API 追加時はここでマージする。
 */
import { useMemo } from "react";
import { useNotificationOptIn } from "../push/useNotificationOptIn";
import { useNotificationStore } from "./notificationStore";
import type { AppNotificationItem } from "./types";
import { usePwaInstall } from "./usePwaInstall";

export const PWA_INSTALL_NOTIFICATION_ID = "local:pwa-install";
export const PUSH_OPT_IN_NOTIFICATION_ID = "local:push-opt-in";

export interface AppNotificationsController {
  items: AppNotificationItem[];
  badgeCount: number;
  push: ReturnType<typeof useNotificationOptIn>;
  pwa: ReturnType<typeof usePwaInstall>;
  dismiss: (id: string) => void;
}

export function useAppNotifications(): AppNotificationsController {
  const push = useNotificationOptIn();
  const pwa = usePwaInstall();
  const dismissedIds = useNotificationStore((s) => s.dismissedIds);
  const dismiss = useNotificationStore((s) => s.dismiss);

  const items = useMemo(() => {
    const next: AppNotificationItem[] = [];
    const dismissed = new Set(dismissedIds);

    if (pwa.shouldGuide && !dismissed.has(PWA_INSTALL_NOTIFICATION_ID)) {
      next.push({
        id: PWA_INSTALL_NOTIFICATION_ID,
        kind: "pwa-install",
        title: "ホーム画面に追加",
        body: pwa.isIosGuide
          ? "通知を受け取るには、共有メニューから「ホーム画面に追加」してこのアプリを開いてください。"
          : "ホーム画面に追加すると、アプリのようにすばやく開けます。Push 通知も利用しやすくなります。",
        countsTowardBadge: true,
      });
    }

    // iOS 非スタンドアロン時は Push 購読不可のため、PWA 案内に一本化
    if (
      push.status === "unsubscribed" &&
      !pwa.isIosGuide &&
      !dismissed.has(PUSH_OPT_IN_NOTIFICATION_ID)
    ) {
      next.push({
        id: PUSH_OPT_IN_NOTIFICATION_ID,
        kind: "push-opt-in",
        title: "通知を有効にする",
        body: "グループメンバーの学習記録を Push で受け取れます。",
        countsTowardBadge: true,
      });
    }

    return next;
  }, [dismissedIds, pwa.isIosGuide, pwa.shouldGuide, push.status]);

  const badgeCount = items.filter((item) => item.countsTowardBadge).length;

  return { items, badgeCount, push, pwa, dismiss };
}
