/**
 * ヘッダ差し込み用の通知 UI（ベル + バッジ + 一覧モーダル）。
 * 開閉はコンポーネント state。Layout 側は本コンポーネントをスロットに置くだけでよい。
 */
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import NotificationModal from "./NotificationModal";
import { useAppNotifications } from "./useAppNotifications";

export default function HeaderNotifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const controller = useAppNotifications();

  return (
    <div className="flex items-center">
      <NotificationBell
        badgeCount={controller.badgeCount}
        open={isModalOpen}
        onClick={() => {
          setIsModalOpen((open) => !open);
        }}
      />
      <NotificationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={controller.items}
        pwa={controller.pwa}
        dismiss={controller.dismiss}
      />
    </div>
  );
}
