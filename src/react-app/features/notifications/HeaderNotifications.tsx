/**
 * ヘッダ差し込み用の通知 UI（ベル + バッジ + 一覧モーダル）。
 * Layout 側は本コンポーネントをスロットに置くだけでよい。
 */
import NotificationBell from "./NotificationBell";
import NotificationModal from "./NotificationModal";
import { useNotificationStore } from "./notificationStore";
import { useAppNotifications } from "./useAppNotifications";

export default function HeaderNotifications() {
  const isModalOpen = useNotificationStore((s) => s.isModalOpen);
  const openModal = useNotificationStore((s) => s.openModal);
  const closeModal = useNotificationStore((s) => s.closeModal);
  const controller = useAppNotifications();

  return (
    <div className="flex items-center">
      <NotificationBell
        badgeCount={controller.badgeCount}
        open={isModalOpen}
        onClick={() => {
          if (isModalOpen) closeModal();
          else openModal();
        }}
      />
      <NotificationModal
        open={isModalOpen}
        onClose={closeModal}
        items={controller.items}
        controller={controller}
      />
    </div>
  );
}
