/// <reference lib="webworker" />
/**
 * カスタムService Worker（vite-plugin-pwaの`injectManifest`戦略でビルドされる）。
 * - Workboxによる静的アセットのプリキャッシュ
 * - Web Push受信 (`push`) → 通知表示
 * - 通知クリック (`notificationclick`) → アプリを開く/既存タブへフォーカス
 * - 購読の失効 (`pushsubscriptionchange`) → 再購読してサーバーへ再送信
 */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import type { PrecacheEntry } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushNotificationPayload {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

self.addEventListener("push", (event) => {
  let payload: PushNotificationPayload = { title: "学習記録シェア" };
  try {
    if (event.data) {
      payload = {
        ...payload,
        ...(event.data.json() as PushNotificationPayload),
      };
    }
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload.data ?? {},
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await (client as WindowClient).navigate(targetUrl).catch(() => {});
          }
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});

/** base64url文字列をVAPID公開鍵として`applicationServerKey`に渡せる`Uint8Array`に変換する。 */
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ブラウザ/OS側の都合で購読が失効した場合、新しい購読を取得してサーバーに再登録する。
// 参考: https://developer.mozilla.org/docs/Web/API/PushSubscriptionCallback/pushsubscriptionchange_event
self.addEventListener("pushsubscriptionchange", (event) => {
  const pushEvent = event as unknown as {
    oldSubscription: PushSubscription | null;
    waitUntil: (promise: Promise<unknown>) => void;
  };

  pushEvent.waitUntil(
    (async () => {
      try {
        const { publicKey } = await fetch("/api/push/vapid-public-key").then(
          (res) => res.json() as Promise<{ publicKey: string }>,
        );
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = newSubscription.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: json.keys?.p256dh ?? "",
              auth: json.keys?.auth ?? "",
            },
          }),
        });
      } catch (error) {
        console.error("Failed to resubscribe after pushsubscriptionchange", error);
      }
    })(),
  );
});
