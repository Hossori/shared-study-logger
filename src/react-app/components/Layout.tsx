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
import { Plus } from "lucide-react";
import type { User } from "../../../shared/schemas";
import { Button } from "@/components/ui/button";
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

export default function Layout({
  user,
  children,
  showRecordActions = false,
}: LayoutProps) {
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <Link
            to="/"
            className="text-foreground hover:text-primary shrink-0 text-base font-bold transition sm:text-lg"
          >
            <h1 className="text-inherit">📚 学習記録</h1>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <HeaderNotifications />
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>

      {showRecordActions && (
        <>
          <PostRecordModal />
          <Button
            size="icon-lg"
            onClick={openPostModal}
            aria-label="記録を追加"
            className="fixed right-5 bottom-5 z-20 size-14 rounded-full sm:hidden"
          >
            <Plus aria-hidden />
          </Button>
        </>
      )}
    </div>
  );
}
