/**
 * 通知一覧モーダル。アプリ内通知（管理者案内・PWA 案内・Push オプトイン案内）を表示する。
 * Push の有効/無効はマイページの設定カードで行う。
 */
import { Link } from "react-router";
import { X } from "lucide-react";
import { toSafeHttpHttpsUrl } from "../../../../shared/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AppNotificationItem } from "./types";
import type { AppNotificationsController } from "./useAppNotifications";
import {
  PWA_INSTALL_NOTIFICATION_ID,
  PUSH_OPT_IN_NOTIFICATION_ID,
} from "./useAppNotifications";

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  items: AppNotificationItem[];
  pwa: AppNotificationsController["pwa"];
  dismiss: (id: string) => void;
}

export default function NotificationModal({
  open,
  onClose,
  items,
  pwa,
  dismiss,
}: NotificationModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>通知</DialogTitle>
        </DialogHeader>
        {items.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyTitle>新しい通知はありません</EmptyTitle>
              <EmptyDescription>
                お知らせがあればここに表示されます。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationListItem
                  item={item}
                  pwa={pwa}
                  onDismiss={() => dismiss(item.id)}
                  onClose={onClose}
                />
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface NotificationListItemProps {
  item: AppNotificationItem;
  pwa: AppNotificationsController["pwa"];
  onDismiss: () => void;
  onClose: () => void;
}

function NotificationListItem({
  item,
  pwa,
  onDismiss,
  onClose,
}: NotificationListItemProps) {
  const safeLinkUrl =
    item.linkUrl != null ? toSafeHttpHttpsUrl(item.linkUrl) : null;
  const linkLabel = item.linkLabel?.trim() || "詳細を見る";

  return (
    <div className="bg-muted/50 rounded-xl px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {item.body}
          </p>
          {safeLinkUrl ? (
            <a
              href={safeLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-1 inline-block text-xs underline underline-offset-3"
            >
              {linkLabel}
            </a>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="この通知を閉じる"
          onClick={onDismiss}
        >
          <X aria-hidden />
        </Button>
      </div>

      {item.id === PWA_INSTALL_NOTIFICATION_ID && pwa.canPromptInstall ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              void pwa.promptInstall().then((outcome) => {
                if (outcome === "accepted") onDismiss();
              });
            }}
          >
            ホーム画面に追加
          </Button>
        </div>
      ) : null}

      {item.id === PUSH_OPT_IN_NOTIFICATION_ID ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link to="/mypage" onClick={onClose} />}
          >
            マイページで設定
          </Button>
        </div>
      ) : null}

      {item.kind === "pwa-install" && pwa.isIosGuide ? (
        <Alert className="mt-2">
          <AlertDescription>
            Safari の共有ボタン →「ホーム画面に追加」
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
