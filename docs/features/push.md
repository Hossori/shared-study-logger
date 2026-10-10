# Push 通知

記録投稿時、他メンバーへ Web Push（VAPID）。送信は Queue の `queue()`。

## 不変条件

- 購読はマイページの `PushSettingsCard` からのユーザー操作（iOS は standalone 必須）
- 1 人 1 メッセージ。410/404 なら購読行を削除
- VAPID 実装は `@pushforge/builder`（Web Crypto）

## 流れ

1. `Notification.requestPermission` → `pushManager.subscribe`
2. `POST /api/push/subscribe` で endpoint をキーに upsert

ログアウト時（`ProfileMenu`）はログアウト API の前に `unsubscribePushOnLogout` で DELETE + ブラウザ購読解除を試みる（上限約 5 秒、失敗してもログアウトは続行）。401 失効時は Cookie が使えないためサーバー DELETE は行わず、ブラウザ側の購読だけ残る場合がある。

マウント時に既存の Push 購読があれば、ユーザー操作なしで `POST /api/push/subscribe` により再紐付けする（TanStack Query の `["push","resync",endpoint]` で重複排除）。`Notification.permission === "denied"` のときは再 POST せず UI は案内のみ（Switch 無効）。
3. 投稿成功時に投稿者以外を enqueue
4. `queue()` が購読ごとに送信し `message.ack()`
5. SW が `showNotification`。`notificationclick` で既存タブへ `postMessage`（`shared/sw-messages.ts`）し、一覧を `resetQueries`

`urlBase64ToUint8Array` はフロントと SW で別バンドルのため両方にある。

## 変更するとき

手動確認は [manual-checklist.md](../manual-checklist.md)。Worker テストは Queue `send` の mock まで。

## 入口

- `src/worker/lib/push.ts`
- `src/worker/routes/push.ts`
- `src/worker/index.ts` の `queue()`
- `public/sw.ts`
- `src/react-app/features/push/PushSettingsCard.tsx`
