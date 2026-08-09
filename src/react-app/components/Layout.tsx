/**
 * ヘッダー（グループ切替、ユーザー名表示、ログアウトボタン、記録追加ボタン、通知有効化ボタン）。
 * モバイルでは記録追加を右下固定のフローティングアクションボタンにし、
 * PCではヘッダーに全ボタンを常時表示する。
 */
import type { ReactNode } from "react";
import type { User } from "../../../shared/schemas";
import { useLogoutMutation } from "../queries/useAuth";
import { useUiStore } from "../stores/uiStore";
import GroupSwitcher from "../features/groups/GroupSwitcher";
import NotificationOptIn from "../features/push/NotificationOptIn";
import Button from "./ui/Button";

interface LayoutProps {
  user: User;
  children: ReactNode;
}

// ヘッダー(sticky)自体の位置・境界線・半透明背景。
const headerClassName =
  "sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur";
// ヘッダー1段目の行レイアウト（中央寄せ・折り返し・余白）。
const headerRowClassName =
  "mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3";
const titleClassName =
  "mr-1 shrink-0 text-base font-bold text-gray-900 sm:text-lg";
// PC専用の操作群（通知ボタン・記録追加ボタン）。モバイルではFAB/2段目に分離するため非表示。
const desktopActionsClassName = "hidden items-center gap-2 sm:flex";
const userSectionClassName =
  "flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-3";
const desktopUserNameClassName =
  "hidden max-w-32 truncate text-sm text-gray-600 sm:inline";
// モバイル: 通知ボタンはヘッダー2段目に表示（記録追加はFABに集約）。
const mobileBarClassName =
  "flex items-center justify-between px-3 pb-2 sm:hidden";
const mobileUserNameClassName = "max-w-40 truncate text-xs text-gray-500";
const mainClassName = "mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8";
// モバイル用フローティングアクションボタン（円形・右下固定）。
const fabClassName =
  "fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg transition hover:bg-indigo-700 sm:hidden";

export default function Layout({ user, children }: LayoutProps) {
  const logoutMutation = useLogoutMutation();
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClassName}>
        <div className={headerRowClassName}>
          <h1 className={titleClassName}>📚 学習記録</h1>

          <div className="min-w-0 flex-1">
            <GroupSwitcher />
          </div>

          <div className={desktopActionsClassName}>
            <NotificationOptIn />
            <Button onClick={openPostModal} className="px-4 py-1.5 text-sm">
              ＋ 記録を追加
            </Button>
          </div>

          <div className={userSectionClassName}>
            <span className={desktopUserNameClassName}>{user.displayName}</span>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="px-2 py-1.5 text-xs sm:text-sm"
            >
              ログアウト
            </Button>
          </div>
        </div>

        <div className={mobileBarClassName}>
          <span className={mobileUserNameClassName}>{user.displayName}</span>
          <NotificationOptIn />
        </div>
      </header>

      <main className={mainClassName}>{children}</main>

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
