/**
 * ヘッダー（2行構成）とメイン領域、モバイル用記録追加 FAB。
 *
 * - 1行目: ロゴ
 * - 2行目: グループ名、（PC）通知・記録追加、プロフィールメニュー
 * - モバイル: 通知はヘッダ直下の閉じられるバー（閉じた後はヘッダから再表示可）
 *
 * 通知の購読状態は `useNotificationOptIn` を Layout で1つだけ持ち、
 * PC/モバイルの表示位置が違っても状態がずれないようにする。
 */
import { useState, type ReactNode } from "react";
import type { User } from "../../../shared/schemas";
import { useUiStore } from "../stores/uiStore";
import { NotificationOptInView } from "../features/push/NotificationOptIn";
import { useNotificationOptIn } from "../features/push/useNotificationOptIn";
import GroupSwitcher from "../features/groups/GroupSwitcher";
import PostRecordModal from "../features/records/PostRecordModal";
import Button from "./ui/Button";
import ProfileMenu from "./ProfileMenu";

interface LayoutProps {
  user: User;
  children: ReactNode;
}

const headerClassName =
  "sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur";
const headerInnerClassName = "mx-auto max-w-4xl px-3 sm:px-6";
const logoRowClassName =
  "flex items-center justify-between gap-2 pt-2.5 pb-1.5 sm:gap-3 sm:pt-3 sm:pb-2";
const titleClassName = "shrink-0 text-base font-bold text-gray-900 sm:text-lg";
const controlsRowClassName =
  "flex items-center gap-2 pb-2.5 sm:gap-3 sm:pb-3";
const desktopActionsClassName = "hidden items-center gap-2 sm:flex";
const mobileReopenButtonClassName =
  "rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 sm:hidden";
const mobileNotificationSlotClassName = "sm:hidden";
const mainClassName = "mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8";
const fabClassName =
  "fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg transition hover:bg-indigo-700 sm:hidden";

export default function Layout({ user, children }: LayoutProps) {
  const openPostModal = useUiStore((state) => state.openPostModal);
  const notification = useNotificationOptIn();
  const [mobileNotificationDismissed, setMobileNotificationDismissed] =
    useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClassName}>
        <div className={headerInnerClassName}>
          <div className={logoRowClassName}>
            <h1 className={titleClassName}>📚 学習記録</h1>
          </div>

          <div className={controlsRowClassName}>
            <div className="min-w-0 flex-1">
              <GroupSwitcher />
            </div>
            <div className={desktopActionsClassName}>
              <NotificationOptInView controller={notification} />
              <Button onClick={openPostModal} className="px-4 py-1.5 text-sm">
                ＋ 記録を追加
              </Button>
            </div>
            {mobileNotificationDismissed && notification.isVisible && (
              <button
                type="button"
                className={mobileReopenButtonClassName}
                aria-label="通知設定を表示"
                title="通知設定を表示"
                onClick={() => setMobileNotificationDismissed(false)}
              >
                {notification.status === "subscribed" ? "🔔" : "🔕"}
              </button>
            )}
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>

      {!mobileNotificationDismissed && (
        <div className={mobileNotificationSlotClassName}>
          <NotificationOptInView
            controller={notification}
            dismissible
            onDismiss={() => setMobileNotificationDismissed(true)}
          />
        </div>
      )}

      <main className={mainClassName}>{children}</main>

      <PostRecordModal />

      <button
        type="button"
        onClick={openPostModal}
        aria-label="記録を追加"
        className={fabClassName}
      >
        ＋
      </button>
    </div>
  );
}
