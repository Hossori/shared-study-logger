/**
 * サーバー配信のアプリ内案内と dismiss。
 * PWA / Push のローカル項目は app/shell がマージする。
 */
import { useMemo } from "react";
import { useEnabledNotificationsQuery } from "./api/useNotifications";
import { useNotificationStore } from "./notificationStore";
import type { AppNotificationItem } from "./types";

export function useAnnouncements() {
  const dismissedIds = useNotificationStore((state) => state.dismissedIds);
  const dismiss = useNotificationStore((state) => state.dismiss);
  const enabledQuery = useEnabledNotificationsQuery();

  const items = useMemo(() => {
    const next: AppNotificationItem[] = [];
    const dismissed = new Set(dismissedIds);

    for (const notification of enabledQuery.data?.notifications ?? []) {
      if (dismissed.has(notification.id)) continue;
      next.push({
        id: notification.id,
        kind: "announcement",
        title: notification.title,
        body: notification.body,
        countsTowardBadge: true,
      });
    }

    return next;
  }, [dismissedIds, enabledQuery.data?.notifications]);

  return { items, dismiss, dismissedIds };
}
