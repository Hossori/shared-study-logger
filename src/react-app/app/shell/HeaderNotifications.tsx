/**
 * ヘッダの通知 UI。サーバー案内・PWA 案内・Push 許可案内をここでマージする。
 */
import { useMemo, useState } from "react";
import {
  NotificationBell,
  NotificationModal,
  PWA_INSTALL_NOTIFICATION_ID,
  PUSH_OPT_IN_NOTIFICATION_ID,
  useAnnouncements,
  type AppNotificationItem,
} from "@/features/notifications";
import { useNotificationOptIn } from "@/features/push";
import { usePwaInstall } from "@/features/pwa";

export default function HeaderNotifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    items: announcementItems,
    dismiss,
    dismissedIds,
  } = useAnnouncements();
  const pwa = usePwaInstall();
  const push = useNotificationOptIn();

  const items = useMemo(() => {
    const next: AppNotificationItem[] = [...announcementItems];
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
        body: "グループメンバーの学習記録を Push で受け取れます。マイページから設定できます。",
        countsTowardBadge: true,
      });
    }

    return next;
  }, [
    announcementItems,
    dismissedIds,
    pwa.isIosGuide,
    pwa.shouldGuide,
    push.status,
  ]);

  const badgeCount = items.filter((item) => item.countsTowardBadge).length;

  return (
    <div className="flex items-center">
      <NotificationBell
        badgeCount={badgeCount}
        open={isModalOpen}
        onClick={() => {
          setIsModalOpen((open) => !open);
        }}
      />
      <NotificationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items}
        pwa={pwa}
        dismiss={dismiss}
      />
    </div>
  );
}
