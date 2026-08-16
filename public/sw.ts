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
import {
  isSkipWaitingMessage,
  NOTIFICATION_CLICK_MESSAGE_TYPE,
} from "../shared/sw-messages";
import { getStudyRecordNotificationTag } from "../shared/notification-tags";
import {
  CLIENT_API_VERSION,
  CLIENT_API_VERSION_HEADER,
} from "../shared/client-api-version";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 旧版PWAだけを一度だけ即時更新するための Cache Storage マーカー。
// 通常更新は待機させ、クライアントの明示操作でのみ有効化する。
const PWA_UPDATE_MIGRATION_CACHE = "shared-study-logger:pwa-update-bridge";
const PWA_UPDATE_MIGRATION_MARKER_URL = new URL(
  "/__pwa-update-bridge-complete__",
  self.location.origin,
).toString();

async function hasPwaUpdateMigrationMarker(): Promise<boolean> {
  const cache = await caches.open(PWA_UPDATE_MIGRATION_CACHE);
  return Boolean(await cache.match(PWA_UPDATE_MIGRATION_MARKER_URL));
}

async function savePwaUpdateMigrationMarker(): Promise<void> {
  const cache = await caches.open(PWA_UPDATE_MIGRATION_CACHE);
  await cache.put(
    PWA_UPDATE_MIGRATION_MARKER_URL,
    new Response("pwa-update-bridge-complete"),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    hasPwaUpdateMigrationMarker().then((hasMarker) => {
      if (!hasMarker) return self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const requiresMigration = !(await hasPwaUpdateMigrationMarker());
      await self.clients.claim();

      if (requiresMigration) {
        const windowClients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        await Promise.all(
          windowClients.map((client) => {
            if (!("navigate" in client)) return Promise.resolve(null);
            return (client as WindowClient).navigate(client.url).catch(
              () => null,
            );
          }),
        );

        // 旧PWAのブリッジが完了してから通常更新を waiting に戻す。
        await savePwaUpdateMigrationMarker();
      }
    })(),
  );
});

// 待機中の Worker はクライアントが明示的に要求した時だけ有効化する。
self.addEventListener("message", (event) => {
  if (isSkipWaitingMessage(event.data)) {
    event.waitUntil(self.skipWaiting());
  }
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

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data ?? {},
  };
  const notificationTag = getStudyRecordNotificationTag(payload.data);
  if (notificationTag) {
    notificationOptions.tag = notificationTag;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions),
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
          // 既存ウィンドウは Query キャッシュが残るため、一覧の取り直しを依頼する。
          // 新規 openWindow 時はコールドスタートで初期取得になるので不要。
          client.postMessage({ type: NOTIFICATION_CLICK_MESSAGE_TYPE });
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
        const { publicKey } = await fetch("/api/push/vapid-public-key", {
          headers: { [CLIENT_API_VERSION_HEADER]: CLIENT_API_VERSION },
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to get VAPID public key");
          return res.json() as Promise<{ publicKey: string }>;
        });
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = newSubscription.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [CLIENT_API_VERSION_HEADER]: CLIENT_API_VERSION,
          },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: json.keys?.p256dh ?? "",
              auth: json.keys?.auth ?? "",
            },
          }),
        });
      } catch (error) {
        console.error(
          "Failed to resubscribe after pushsubscriptionchange",
          error,
        );
      }
    })(),
  );
});
