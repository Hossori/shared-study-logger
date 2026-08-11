/**
 * 共通ヘッダーとメイン領域。
 *
 * - ヘッダ: ロゴ（ホームへ）・通知（ベル/バッジ/モーダル）・プロフィールメニュー
 * - グループ切替・「記録を追加」は記録一覧画面側に置く
 * - モバイル FAB は `showRecordActions` が true のときのみ（記録一覧表示中）
 *
 * 通知 UI は `HeaderNotifications` に集約。Layout は差し込みのみ。
 */
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { User } from "../../../shared/schemas";
import { useUiStore } from "../stores/uiStore";
import HeaderNotifications from "../features/notifications/HeaderNotifications";
import PostRecordModal from "../features/records/PostRecordModal";
import ProfileMenu from "./ProfileMenu";

interface LayoutProps {
  user: User;
  children: ReactNode;
  /** true のとき投稿モーダル用 FAB を出す（記録一覧画面のみ） */
  showRecordActions?: boolean;
}

const headerClassName =
  "sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur";
const headerInnerClassName =
  "mx-auto flex max-w-4xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3";
const logoLinkClassName =
  "shrink-0 text-base font-bold text-gray-900 transition hover:text-indigo-700 sm:text-lg";
const headerActionsClassName = "ml-auto flex shrink-0 items-center gap-2";
const mainClassName = "mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8";
const fabClassName =
  "fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg transition hover:bg-indigo-700 sm:hidden";

export default function Layout({
  user,
  children,
  showRecordActions = false,
}: LayoutProps) {
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClassName}>
        <div className={headerInnerClassName}>
          <Link to="/" className={logoLinkClassName}>
            <h1 className="text-inherit">📚 学習記録</h1>
          </Link>

          <div className={headerActionsClassName}>
            <HeaderNotifications />
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>

      <main className={mainClassName}>{children}</main>

      {showRecordActions && (
        <>
          <PostRecordModal />
          <button
            type="button"
            onClick={openPostModal}
            aria-label="記録を追加"
            className={fabClassName}
          >
            ＋
          </button>
        </>
      )}
    </div>
  );
}
