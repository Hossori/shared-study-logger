/**
 * ヘッダー用プロフィールメニュー。丸いアバターアイコンを押すと
 * 「マイページ」「通知管理（ADMINのみ）」「ログアウト」を選べるドロップダウンを表示する。
 * ログアウトは確認ダイアログ付き。
 */
import { Link } from "react-router";
import { isAdmin, type User } from "../../../shared/schemas";
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
import UserAvatar from "./UserAvatar";
import { useLogoutMutation } from "../queries/useAuth";
import { useConfirm } from "./useConfirm";

interface ProfileMenuProps {
  user: User;
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const logoutMutation = useLogoutMutation();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "ログアウト",
      message: "ログアウトしますか？",
      confirmLabel: "ログアウト",
      variant: "danger",
    });
    if (!ok) return;
    logoutMutation.mutate();
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
            <DropdownMenuItem render={<Link to="/admin/notifications" />}>
              通知管理
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            disabled={logoutMutation.isPending}
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
