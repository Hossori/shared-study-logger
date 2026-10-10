# Push 通知

記録投稿時、他メンバーへ Web Push（VAPID）。送信は Queue の `queue()`。

## 不変条件

- 購読はマイページの `PushSettingsCard` からのユーザー操作（iOS は standalone 必須）
- 1 人 1 メッセージ。410/404 なら購読行を削除
- VAPID 実装は `@pushforge/builder`（Web Crypto）

## 流れ

1. `Notification.requestPermission` → `pushManager.subscribe`
2. `POST /api/push/subscribe` で endpoint をキーに upsert
3. 投稿成功時に投稿者以外を enqueue
4. `queue()` が購読ごとに送信し `message.ack()`
5. SW が `showNotification`。`notificationclick` で既存タブへ `postMessage`（`shared/sw-messages.ts`）し、一覧を `resetQueries`

`urlBase64ToUint8Array` と Push ペイロード正規化は `shared/web-push.ts` に集約し、フロント（`features/push/vapid.ts` 経由）と SW の両方から import する。

## Service Worker

- **`push`**: 受信 JSON は `normalizePushPayload` で title / body / data を正規化してから `showNotification` する。
- **`pushsubscriptionchange`**: 新しい購読を取得したあと `POST /api/push/subscribe` する。応答が `ok` でない場合、または `p256dh` / `auth` が欠けている場合はサーバーへ送らず `console.error` する。

## 変更するとき

手動確認は [manual-checklist.md](../manual-checklist.md)。Worker テストは Queue `send` の mock まで。

## 入口

- `src/worker/lib/push.ts`
- `src/worker/routes/push.ts`
- `src/worker/index.ts` の `queue()`
- `public/sw.ts`
- `shared/web-push.ts`
- `src/react-app/features/push/PushSettingsCard.tsx`
