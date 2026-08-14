/**
 * 通知一覧モーダル。アプリ内通知（管理者案内・PWA 案内・Push オプトイン）を表示する。
 * sticky ヘッダ内の stacking context を避けるため document.body へ portal する。
 */
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "../../components/ui/Button";
import type { AppNotificationItem } from "./types";
import type { AppNotificationsController } from "./useAppNotifications";
import {
  PWA_INSTALL_NOTIFICATION_ID,
  PUSH_OPT_IN_NOTIFICATION_ID,
} from "./useAppNotifications";

const overlayClassName =
  "fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-start sm:justify-end sm:bg-black/30 sm:pt-14 sm:pr-4";
const panelClassName =
  "flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-sm sm:rounded-2xl";
const closeButtonClassName =
  "rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600";

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
  const titleId = useId();
  const { push, pwa, dismiss } = controller;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={overlayClassName} onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id={titleId} className="text-base font-bold text-gray-900">
            通知
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={closeButtonClassName}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-2 py-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500">
              新しい通知はありません
            </p>
          ) : (
            <ul className="space-y-2">
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
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {push.status === "subscribed"
                  ? "Push 通知は有効です"
                  : "Push 通知はオフです"}
              </p>
              <Button
                variant={push.status === "subscribed" ? "secondary" : "primary"}
                className="px-3 py-1.5 text-xs"
                disabled={push.isPending}
                onClick={() =>
                  void (push.status === "subscribed"
                    ? push.disable()
                    : push.enable())
                }
              >
                {push.status === "subscribed" ? "無効にする" : "有効にする"}
              </Button>
            </div>
            {push.error ? (
              <p className="mt-1 text-xs text-red-600">{push.error}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
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
    <div className="rounded-xl bg-gray-50 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            {item.body}
          </p>
        </div>
        <button
          type="button"
          aria-label="この通知を閉じる"
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          onClick={onDismiss}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.id === PWA_INSTALL_NOTIFICATION_ID && pwa.canPromptInstall ? (
          <Button
            className="px-3 py-1.5 text-xs"
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
            className="px-3 py-1.5 text-xs"
            disabled={push.isPending}
            onClick={() => void push.enable()}
          >
            {push.isPending ? "設定中…" : "通知を有効にする"}
          </Button>
        ) : null}
      </div>

      {item.kind === "push-opt-in" && push.error ? (
        <p className="mt-2 text-xs text-red-600">{push.error}</p>
      ) : null}

      {item.kind === "pwa-install" && pwa.isIosGuide ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          Safari の共有ボタン →「ホーム画面に追加」
        </p>
      ) : null}
    </div>
  );
}
