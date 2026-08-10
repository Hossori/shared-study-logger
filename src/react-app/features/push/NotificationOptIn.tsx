/**
 * 通知許可 UI。状態は `useNotificationOptIn` に集約し、
 * Layout が PC/モバイルの表示位置を分けても購読状態がずれないようにする。
 */
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import {
  useNotificationOptIn,
  type NotificationOptInController,
} from "./useNotificationOptIn";

const iosBannerClassName =
  "rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm";
const baseToggleButtonClassName =
  "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
const subscribedToggleButtonClassName =
  "border-green-300 bg-green-50 text-green-700 hover:bg-green-100";
const unsubscribedToggleButtonClassName =
  "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

interface NotificationOptInViewProps {
  controller: NotificationOptInController;
  /** true のとき通知UIの右に閉じるボタンを出す（モバイルのヘッダ下バー用）。 */
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function NotificationOptInView({
  controller,
  dismissible = false,
  onDismiss,
}: NotificationOptInViewProps) {
  const { status, error, isPending, isVisible, enable, disable } = controller;

  if (!isVisible) return null;

  const dismissButton =
    dismissible && onDismiss ? (
      <button
        type="button"
        aria-label="通知バーを閉じる"
        className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        onClick={onDismiss}
      >
        ✕
      </button>
    ) : null;

  const wrapMobileBar = (content: ReactNode) =>
    dismissible ? (
      <div className="flex items-start gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <div className="min-w-0 flex-1">{content}</div>
        {dismissButton}
      </div>
    ) : (
      content
    );

  if (status === "ios-add-to-home") {
    return wrapMobileBar(
      <div className={iosBannerClassName}>
        通知を受け取るには、共有メニューから「ホーム画面に追加」してこのアプリを開いてください。
      </div>,
    );
  }

  return wrapMobileBar(
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        type="button"
        onClick={status === "subscribed" ? disable : enable}
        disabled={isPending}
        title={
          status === "subscribed" ? "通知を無効にする" : "通知を有効にする"
        }
        className={cn(
          baseToggleButtonClassName,
          status === "subscribed"
            ? subscribedToggleButtonClassName
            : unsubscribedToggleButtonClassName,
        )}
      >
        {status === "subscribed" ? "🔔 通知オン" : "🔕 通知を有効にする"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>,
  );
}

/** 単体利用向け（状態を内包する薄いラッパー）。 */
export default function NotificationOptIn(
  props: Omit<NotificationOptInViewProps, "controller">,
) {
  const controller = useNotificationOptIn();
  return <NotificationOptInView controller={controller} {...props} />;
}
