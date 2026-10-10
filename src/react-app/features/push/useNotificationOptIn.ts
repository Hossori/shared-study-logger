/**
 * Push 通知オプトインの状態・購読操作（UI 非依存）。
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useVapidPublicKeyQuery,
  postPushSubscription,
} from "./api/usePushSubscription";
import { isIosNonStandalone } from "@/lib/iosStandalone";
import { isPushSupported, urlBase64ToUint8Array } from "./vapid";
import type { PushSubscriptionInput } from "@shared/schemas";
import {
  PushSubscribeFormSchema,
  PushUnsubscribeFormSchema,
} from "./pushSubscriptionForm";
import { withTimeout } from "./withTimeout";

const SERVICE_WORKER_READY_CHECK_MS = 10_000;
const SERVICE_WORKER_READY_ENABLE_MS = 10_000;

export type NotificationOptInStatus =
  | "checking"
  | "unsupported"
  | "ios-add-to-home"
  | "subscribed"
  | "unsubscribed"
  | "denied";

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
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);
  const queryClient = useQueryClient();
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
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const registration = await withTimeout(
          navigator.serviceWorker.ready,
          SERVICE_WORKER_READY_CHECK_MS,
        );
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;

        if (existing) {
          setStatus("subscribed");
          const subscriptionJson = existing.toJSON();
          const parsed = PushSubscribeFormSchema.safeParse({
            endpoint: existing.endpoint,
            keys: {
              p256dh: subscriptionJson.keys?.p256dh ?? "",
              auth: subscriptionJson.keys?.auth ?? "",
            },
          } satisfies PushSubscriptionInput);
          if (parsed.success) {
            void queryClient
              .fetchQuery({
                queryKey: ["push", "resync", existing.endpoint],
                queryFn: () => postPushSubscription(parsed.data),
                staleTime: Infinity,
                retry: false,
              })
              .catch(() => {
                // 再紐付け失敗は UI に出さない
              });
          }
          return;
        }

        setStatus("unsubscribed");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    void checkStatus();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const enable = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        return;
      }
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
      const registration = await withTimeout(
        navigator.serviceWorker.ready,
        SERVICE_WORKER_READY_ENABLE_MS,
        "service worker ready timeout",
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const subscriptionJson = subscription.toJSON();
      const parsed = PushSubscribeFormSchema.safeParse({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh ?? "",
          auth: subscriptionJson.keys?.auth ?? "",
        },
      } satisfies PushSubscriptionInput);
      if (!parsed.success) {
        try {
          await subscription.unsubscribe();
        } catch {
          // ignore
        }
        setError("通知の有効化に失敗しました。");
        return;
      }
      try {
        await postPushSubscription(parsed.data);
      } catch (err) {
        console.error(err);
        try {
          await subscription.unsubscribe();
        } catch {
          // ignore
        }
        setError("通知の有効化に失敗しました。");
        return;
      }
      setStatus("subscribed");
    } catch (err) {
      console.error(err);
      setError("通知の有効化に失敗しました。");
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  const disable = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsBusy(true);
    setError(null);
    try {
      const registration = await withTimeout(
        navigator.serviceWorker.ready,
        SERVICE_WORKER_READY_ENABLE_MS,
      );
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const parsed = PushUnsubscribeFormSchema.safeParse({
          endpoint: subscription.endpoint,
        });
        if (!parsed.success) {
          setError("通知の無効化に失敗しました。");
          return;
        }
        await unsubscribeMutation.mutateAsync(parsed.data);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error(err);
      setError("通知の無効化に失敗しました。");
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  };

  const isPending =
    isBusy || subscribeMutation.isPending || unsubscribeMutation.isPending;

  return {
    status,
    error,
    isPending,
    isVisible: status !== "checking" && status !== "unsupported",
    enable,
    disable,
  };
}
