/**
 * 通知許可ボタン。iOSの場合は「ホーム画面に追加してください」という案内を表示する。
 */
import { useEffect, useState } from "react";
import {
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useVapidPublicKeyQuery,
} from "../../queries/usePushSubscription";
import { isIosNonStandalone, isPushSupported, urlBase64ToUint8Array } from "../../lib/push";
import type { PushSubscriptionInput } from "../../../../shared/schemas";

type Status = "checking" | "unsupported" | "ios-add-to-home" | "subscribed" | "unsubscribed";

export default function NotificationOptIn() {
  const [status, setStatus] = useState<Status>("checking");
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

  const handleEnable = async () => {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("通知が許可されませんでした。ブラウザの設定を確認してください。");
        return;
      }
      if (!vapidPublicKey) {
        setError("VAPID公開鍵の取得に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
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

  const handleDisable = async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error(err);
      setError("通知の無効化に失敗しました。");
    }
  };

  if (status === "checking") return null;

  if (status === "ios-add-to-home") {
    return (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
        通知を受け取るには、共有メニューから「ホーム画面に追加」してこのアプリを開いてください。
      </div>
    );
  }

  if (status === "unsupported") {
    return null;
  }

  const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={status === "subscribed" ? handleDisable : handleEnable}
        disabled={isPending}
        title={status === "subscribed" ? "通知を無効にする" : "通知を有効にする"}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
          status === "subscribed"
            ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {status === "subscribed" ? "🔔 通知オン" : "🔕 通知を有効にする"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
