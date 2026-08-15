/**
 * 通知一覧モーダル。アプリ内通知（管理者案内・PWA 案内・Push オプトイン）を表示する。
 */
import { X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
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
  controller: AppNotificationsController;
}

export default function NotificationModal({
  open,
  onClose,
  items,
  controller,
}: NotificationModalProps) {
  const { push, pwa, dismiss } = controller;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="px-4 py-3">
          <DialogTitle>通知</DialogTitle>
        </DialogHeader>
        <Separator />

        <div className="overflow-y-auto px-2 py-2">
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
                    push={push}
                    pwa={pwa}
                    onDismiss={() => dismiss(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {push.status === "subscribed" || push.status === "unsubscribed" ? (
          <>
            <Separator />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {push.status === "subscribed"
                    ? "Push 通知は有効です"
                    : "Push 通知はオフです"}
                </p>
                <Button
                  variant={push.status === "subscribed" ? "outline" : "default"}
                  size="sm"
                  disabled={push.isPending}
                  onClick={() =>
                    void (push.status === "subscribed"
                      ? push.disable()
                      : push.enable())
                  }
                >
                  {push.isPending ? <Spinner data-icon="inline-start" /> : null}
                  {push.status === "subscribed" ? "無効にする" : "有効にする"}
                </Button>
              </div>
              {push.error ? (
                <p className="text-destructive mt-1 text-xs">{push.error}</p>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface NotificationListItemProps {
  item: AppNotificationItem;
  push: AppNotificationsController["push"];
  pwa: AppNotificationsController["pwa"];
  onDismiss: () => void;
}

function NotificationListItem({
  item,
  push,
  pwa,
  onDismiss,
}: NotificationListItemProps) {
  return (
    <div className="bg-muted/50 rounded-xl px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {item.body}
          </p>
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

      <div className="mt-3 flex flex-wrap gap-2">
        {item.id === PWA_INSTALL_NOTIFICATION_ID && pwa.canPromptInstall ? (
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
        ) : null}

        {item.id === PUSH_OPT_IN_NOTIFICATION_ID ? (
          <Button
            size="sm"
            disabled={push.isPending}
            onClick={() => void push.enable()}
          >
            {push.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                設定中…
              </>
            ) : (
              "通知を有効にする"
            )}
          </Button>
        ) : null}
      </div>

      {item.kind === "push-opt-in" && push.error ? (
        <p className="text-destructive mt-2 text-xs">{push.error}</p>
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
