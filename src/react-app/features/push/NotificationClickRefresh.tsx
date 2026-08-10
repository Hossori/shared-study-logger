/**
 * Push通知タップ時に Service Worker から届くメッセージを受け取り、
 * 学習記録一覧を先頭から取り直す（温かい復帰で古いキャッシュが残るのを防ぐ）。
 * フォーカス復帰全般では動かさない（通知タップ時のみ）。
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NOTIFICATION_CLICK_MESSAGE_TYPE } from "../../../../shared/sw-messages";
import { recordsQueryKeys } from "../../queries/useRecords";

export default function NotificationClickRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== NOTIFICATION_CLICK_MESSAGE_TYPE) return;
      void queryClient.resetQueries({ queryKey: recordsQueryKeys.all });
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [queryClient]);

  return null;
}
