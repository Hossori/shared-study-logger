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

interface LayoutProps {
  user: User;
  children: ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  const logoutMutation = useLogoutMutation();
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <h1 className="mr-1 shrink-0 text-base font-bold text-gray-900 sm:text-lg">
            📚 学習記録
          </h1>

          <div className="min-w-0 flex-1">
            <GroupSwitcher />
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <NotificationOptIn />
            <button
              type="button"
              onClick={openPostModal}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              ＋ 記録を追加
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-3">
            <span className="hidden max-w-32 truncate text-sm text-gray-600 sm:inline">
              {user.displayName}
            </span>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 sm:text-sm"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* モバイル: 通知ボタンはヘッダー2段目に表示（記録追加はFABに集約） */}
        <div className="flex items-center justify-between px-3 pb-2 sm:hidden">
          <span className="max-w-40 truncate text-xs text-gray-500">
            {user.displayName}
          </span>
          <NotificationOptIn />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>

      {/* モバイル用フローティングアクションボタン */}
      <button
        type="button"
        onClick={openPostModal}
        aria-label="記録を追加"
        className="fixed right-5 bottom-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg transition hover:bg-indigo-700 sm:hidden"
      >
        ＋
      </button>
    </div>
  );
}
