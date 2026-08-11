/**
 * ヘッダ用通知ベル。未読（アクティブ通知）件数をバッジ表示する。
 */
import { Bell } from "lucide-react";

interface NotificationBellProps {
  badgeCount: number;
  open: boolean;
  onClick: () => void;
}

const bellButtonClassName =
  "relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const badgeClassName =
  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white";

export default function NotificationBell({
  badgeCount,
  open,
  onClick,
}: NotificationBellProps) {
  const label =
    badgeCount > 0
      ? `通知（${badgeCount}件）`
      : open
        ? "通知を閉じる"
        : "通知を開く";

  return (
    <button
      type="button"
      className={bellButtonClassName}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
    >
      <Bell className="h-5 w-5" aria-hidden />
      {badgeCount > 0 ? (
        <span className={badgeClassName} aria-hidden="true">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}
