# Push通知機能

[← SKILL.md](../SKILL.md)

- **概要**: グループメンバーが記録を投稿すると、他のメンバーへWeb Push通知（VAPID方式）を送る。
- **関連ファイル**:
  - Worker: `src/worker/lib/push.ts`（`sendPushNotification`、`@pushforge/builder`の
    `buildPushHTTPRequest`を使用、`PushQueueMessage`型定義）、
    `src/worker/routes/push.ts`（`GET /vapid-public-key`,`POST/DELETE /subscribe`）、
    `src/worker/index.ts`の`queue()`ハンドラ（Queueコンシューマ本体）、
    `src/worker/lib/db.ts`の`getPushSubscriptionsForUser`/`upsertPushSubscription`/
    `deletePushSubscriptionByEndpoint`/`deletePushSubscriptionById`
  - フロント: `src/react-app/features/push/useNotificationOptIn.ts`（許可リクエスト～購読操作）、
    `src/react-app/features/push/PushSettingsCard.tsx`（マイページの有効/無効 UI）、
    `src/react-app/features/notifications/`（ベル一覧・未購読時のマイページ誘導）、
    `src/react-app/features/push/NotificationClickRefresh.tsx`（通知タップ時の一覧取り直し）、
    `src/react-app/queries/usePushSubscription.ts`、`src/react-app/lib/push.ts`
    （`urlBase64ToUint8Array`/`isIosNonStandalone`/`isPushSupported`）
  - Service Worker側: `public/sw.ts`の`push`/`notificationclick`/`pushsubscriptionchange`
    イベントハンドラ（同名の変換関数`urlBase64ToUint8Array`をSW内にも独立実装している。
    フロント側`lib/push.ts`と重複しているが、SWは別バンドルのため意図的な重複）
  - 共通: `shared/sw-messages.ts`（SW↔フロントの`postMessage` type。injectManifestでSWからもimport可）
  - 共通: `shared/schemas.ts`の`PushSubscriptionSchema`（ブラウザの`PushSubscription.toJSON()`
    形式に合わせている）
- **データフロー**:
  1. マイページの Push 設定カードからの明示操作で`useNotificationOptIn.enable()`（iOSの制約でユーザー操作必須）→
     `Notification.requestPermission()` → 許可されたら`navigator.serviceWorker.ready`経由で
     `pushManager.subscribe({ applicationServerKey: VAPID公開鍵 })`
  2. 取得した`endpoint`/`p256dh`/`auth`を`POST /api/push/subscribe`でD1へupsert
     （`endpoint`をユニークキーとして同一端末からの再登録に対応）
  3. 記録投稿成功時、`records.ts`が投稿者以外の全メンバー分`PUSH_QUEUE`へenqueue
     （メッセージ形式は`PushQueueMessage`: `{ userId, notification: { title, body, data } }`）
  4. `index.ts`の`queue()`ハンドラがバッチ内の各メッセージについて`getPushSubscriptionsForUser`
     で対象ユーザーの全購読を取得 → `sendPushNotification`で各購読へVAPID署名+暗号化
     (aes128gcm)したペイロードをfetchでPOST → 成否に関わらず`message.ack()`（1メンバー1
     メッセージなので他メンバーへの影響を防ぐ設計）
  5. 送信結果が410/404の場合は`deletePushSubscriptionById`で該当購読をD1から自動削除
     （期限切れ購読のクリーンアップ）
  6. ブラウザのService Worker (`public/sw.ts`)が`push`イベントを受信し`showNotification()`、
     `notificationclick`で既存タブへフォーカス（`navigate`も試行）または`clients.openWindow('/')`
  7. 既存クライアントを開く場合は `shared/sw-messages.ts`の
     `NOTIFICATION_CLICK_MESSAGE_TYPE`で`postMessage`し、フロントの
     `NotificationClickRefresh`が学習記録クエリを`resetQueries`して先頭から取り直す
     （温かい復帰で古い一覧が残る対策。フォーカス復帰全般では行わない）
- **注意点・既知の制約**:
  - **iOSの制約**: PWAをホーム画面に追加（standaloneモード）していないとPush通知を受信
    できない。`isIosNonStandalone()`でUser-Agentベースに判定し、アプリ内通知（ベル一覧）が
    「ホーム画面に追加」の案内を表示する。またiOSでは通知許可リクエストは直接的なユーザー操作の
    中でのみ機能する（ページ読み込み時の自動リクエストは不可）。有効/無効の恒常トグルは
    マイページの`PushSettingsCard`（Switch の操作から`enable`/`disable`）に置き、
    通知モーダル下部には置かない。未購読時のベル一覧はマイページへの一度きりの案内にする。
  - Push送信は「ベストエフォート」であり配信保証はない。Cloudflare Queuesの無料枠
    （1万オペレーション/日）を超えると失敗する点に留意。
  - `web-push`（Node製）はWorkers上で動作しないため使えない。VAPID実装は
    Web Crypto APIのみで完結する`@pushforge/builder`を採用している。代替ライブラリへの
    変更を検討する場合はWorkers対応（Node crypto非依存）であることを必ず確認すること。
  - 通知タップ時の一覧取り直しは既存ウィンドウの`postMessage`経由（typeは
    `shared/sw-messages.ts`）。新規起動（`openWindow`）はコールドスタートのため別途メッセージは送らない。
  - SWを更新したあとは、端末側で新しい`sw.js`が有効になるまで（更新待ち・再起動等）
    古い`notificationclick`のまま動く点に留意。
