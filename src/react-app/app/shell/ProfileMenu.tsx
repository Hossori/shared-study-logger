/**
 * ヘッダー用プロフィールメニュー。丸いアバターアイコンを押すと
 * 「マイページ」「グループユーザー管理 / 通知管理（ADMINのみ）」「ログアウト」を選べるドロップダウンを表示する。
 * ログアウトは確認ダイアログ付き。
 */
import { Link } from "react-router";
import { isAdmin, type User } from "@shared/schemas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { useConfirm } from "@/components/useConfirm";
import { useState } from "react";
import { useLogoutMutation } from "@/features/auth";
import { unsubscribePushOnLogout } from "@/features/push";
import { ApiError } from "@/lib/api";

interface ProfileMenuProps {
  user: User;
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const logoutMutation = useLogoutMutation();
  const confirm = useConfirm();
  const [isPreparing, setIsPreparing] = useState(false);

  const handleLogout = async () => {
    const ok = await confirm({
      title: "ログアウト",
      message: "ログアウトしますか？",
      confirmLabel: "ログアウト",
      variant: "danger",
    });
    if (!ok) return;
    setIsPreparing(true);
    try {
      await unsubscribePushOnLogout();
    } finally {
      setIsPreparing(false);
    }
    await logoutWithRetry();
  };

  const logoutWithRetry = async (): Promise<void> => {
    for (;;) {
      try {
        await logoutMutation.mutateAsync();
        return;
      } catch (error) {
        // 401 は既に未ログイン。me が null になり ProtectedRoute が /login へ遷移する。
        if (error instanceof ApiError && error.status === 401) return;
        const retry = await confirm({
          title: "ログアウトに失敗しました",
          message:
            "ログアウトできませんでした。ログイン状態のままです。再試行しますか？",
          confirmLabel: "再試行",
          cancelLabel: "閉じる",
          variant: "danger",
        });
        if (!retry) return;
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="プロフィールメニュー"
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="プロフィールメニュー"
          />
        }
      >
        <UserAvatar avatarKey={user.avatarKey} className="size-full" />
        <span className="sr-only">プロフィールメニュー</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={`/users/${user.id}`} />}>
            マイページ
          </DropdownMenuItem>
          {isAdmin(user) ? (
            <>
              <DropdownMenuItem render={<Link to="/admin/groups" />}>
                グループユーザー管理
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/admin/notifications" />}>
                通知管理
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            disabled={logoutMutation.isPending || isPreparing}
            onClick={() => {
              void handleLogout();
            }}
          >
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
