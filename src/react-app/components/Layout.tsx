/**
 * ヘッダー（2行構成）とメイン領域、モバイル用記録追加 FAB。
 *
 * - 1行目: ロゴ（📚 学習記録）と、PC向け「記録を追加」ボタン
 * - 2行目: グループ名（GroupSwitcher）、NotificationOptIn、プロフィールメニュー
 * - モバイルの記録追加は右下 FAB（sm: では非表示）
 *
 * レスポンシブは `sm:` で1コンポーネント内に両レイアウトを表現する（デバイス別実装は作らない）。
 */
import type { ReactNode } from "react";
import type { User } from "../../../shared/schemas";
import { useUiStore } from "../stores/uiStore";
import GroupSwitcher from "../features/groups/GroupSwitcher";
import NotificationOptIn from "../features/push/NotificationOptIn";
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
// 1行目: ロゴ + PC用記録追加
const logoRowClassName =
  "flex items-center justify-between gap-2 pt-2.5 pb-1.5 sm:gap-3 sm:pt-3 sm:pb-2";
const titleClassName = "shrink-0 text-base font-bold text-gray-900 sm:text-lg";
const desktopActionsClassName = "hidden items-center gap-2 sm:flex";
// 2行目: グループ + 通知 + プロフィール
const controlsRowClassName =
  "flex items-center gap-2 pb-2.5 sm:gap-3 sm:pb-3";
const mainClassName = "mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8";
const fabClassName =
  "fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg transition hover:bg-indigo-700 sm:hidden";

export default function Layout({ user, children }: LayoutProps) {
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClassName}>
        <div className={headerInnerClassName}>
          <div className={logoRowClassName}>
            <h1 className={titleClassName}>📚 学習記録</h1>
            <div className={desktopActionsClassName}>
              <Button onClick={openPostModal} className="px-4 py-1.5 text-sm">
                ＋ 記録を追加
              </Button>
            </div>
          </div>

          <div className={controlsRowClassName}>
            <div className="min-w-0 flex-1">
              <GroupSwitcher />
            </div>
            <NotificationOptIn />
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>

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
