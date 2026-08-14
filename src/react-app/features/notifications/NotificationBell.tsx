/**
 * ヘッダ用通知ベル。未読（アクティブ通知）件数をバッジ表示する。
 */
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationBellProps {
  badgeCount: number;
  open: boolean;
  onClick: () => void;
}

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
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="relative rounded-full"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onClick}
    >
      <Bell aria-hidden />
      <span className="sr-only">{label}</span>
      {badgeCount > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1"
          aria-hidden="true"
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </Badge>
      ) : null}
    </Button>
  );
}
