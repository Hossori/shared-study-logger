/**
 * ヘッダー用プロフィールメニュー。丸いアバターアイコンを押すと
 * 「マイページ」「ログアウト」を選べるドロップダウンを表示する。
 * クリック外または再度アイコンで閉じる。ログアウトは確認ダイアログ付き。
 */
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { getAvatarUrl, type User } from "../../../shared/schemas";
import { useLogoutMutation } from "../queries/useAuth";

interface ProfileMenuProps {
  user: User;
}

const avatarButtonClassName =
  "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-gray-200 transition hover:ring-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const menuPanelClassName =
  "absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg";
const menuItemClassName =
  "block w-full px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50";
const menuItemDangerClassName =
  "block w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const logoutMutation = useLogoutMutation();
  const avatarUrl = getAvatarUrl(user.avatarKey);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    if (!window.confirm("ログアウトしますか？")) return;
    setOpen(false);
    logoutMutation.mutate();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="プロフィールメニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className={avatarButtonClassName}
      >
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </button>

      {open ? (
        <div id={menuId} role="menu" className={menuPanelClassName}>
          <p className="truncate border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
            {user.displayName}
          </p>
          <Link
            to="/mypage"
            role="menuitem"
            className={menuItemClassName}
            onClick={() => setOpen(false)}
          >
            マイページ
          </Link>
          <button
            type="button"
            role="menuitem"
            className={menuItemDangerClassName}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            ログアウト
          </button>
        </div>
      ) : null}
    </div>
  );
}
