/**
 * Push 通知オプトインの状態・購読操作（UI 非依存）。
 */
import { useEffect, useState } from "react";
import {
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useVapidPublicKeyQuery,
} from "../../queries/usePushSubscription";
import {
  isIosNonStandalone,
  isPushSupported,
  urlBase64ToUint8Array,
} from "../../lib/push";
import type { PushSubscriptionInput } from "../../../../shared/schemas";

export type NotificationOptInStatus =
  | "checking"
  | "unsupported"
  | "ios-add-to-home"
  | "subscribed"
  | "unsubscribed";

export interface NotificationOptInController {
  status: NotificationOptInStatus;
  error: string | null;
  isPending: boolean;
  /** checking / unsupported 以外なら UI を出してよい */
  isVisible: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function useNotificationOptIn(): NotificationOptInController {
  const [status, setStatus] = useState<NotificationOptInStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const { data: vapidPublicKey } = useVapidPublicKeyQuery();
  const subscribeMutation = useSubscribePushMutation();
  const unsubscribeMutation = useUnsubscribePushMutation();

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (isIosNonStandalone()) {
        setStatus("ios-add-to-home");
        return;
      }
      if (!isPushSupported()) {
        setStatus("unsupported");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setStatus(existing ? "subscribed" : "unsubscribed");
        }
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    void checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          "通知が許可されませんでした。ブラウザの設定を確認してください。",
        );
        return;
      }
      if (!vapidPublicKey) {
        setError(
          "VAPID公開鍵の取得に失敗しました。時間をおいて再度お試しください。",
        );
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const subscriptionJson = subscription.toJSON();
      const payload: PushSubscriptionInput = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh ?? "",
          auth: subscriptionJson.keys?.auth ?? "",
        },
      };
      await subscribeMutation.mutateAsync(payload);
      setStatus("subscribed");
    } catch (err) {
      console.error(err);
      setError("通知の有効化に失敗しました。");
    }
  };

  const disable = async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error(err);
      setError("通知の無効化に失敗しました。");
    }
  };

  return {
    status,
    error,
    isPending: subscribeMutation.isPending || unsubscribeMutation.isPending,
    isVisible: status !== "checking" && status !== "unsupported",
    enable,
    disable,
  };
}
