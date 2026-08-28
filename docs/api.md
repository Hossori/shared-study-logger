# API エンドポイント一覧

本ドキュメントが API 一覧の正本です。概要・機能索引は
[`.cursor/skills/shared-study-logger-overview/SKILL.md`](../.cursor/skills/shared-study-logger-overview/SKILL.md)
を参照。

| メソッド | パス | 認証 | 概要 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 不要 | ログイン（email/password検証、セッションCookie発行） |
| POST | `/api/auth/logout` | 必要 | ログアウト（KVセッション削除、Cookieクリア） |
| GET | `/api/auth/me` | 必要 | ログイン中ユーザー情報取得（`bio` / `avatarKey` / `role` 含む） |
| PATCH | `/api/auth/me` | 必要 | プロフィール更新（`displayName` / `bio` / `avatarKey`） |
| POST | `/api/auth/password` | 必要 | パスワード変更（現在のパスワード検証 + PBKDF2再ハッシュ） |
| GET | `/api/users/:userId` | 必要 | 公開プロフィール取得（`displayName` / `bio` / `avatarKey`。email なし） |
| GET | `/api/groups` | 必要 | 自分が所属するグループ一覧 |
| GET | `/api/groups/:groupId/records` | 必要+所属チェック | 記録一覧（カーソルページネーション、新しい順。`durationMinutes` は未設定なら `null`） |
| POST | `/api/groups/:groupId/records` | 必要+所属チェック | 記録投稿（成功時に他メンバーへPush enqueue。`durationMinutes` は任意） |
| PATCH | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の編集（`durationMinutes` 省略時は既存値を維持、`null` で未設定に戻す） |
| DELETE | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の削除 |
| GET | `/api/push/vapid-public-key` | 不要 | Push購読用のVAPID公開鍵取得 |
| POST | `/api/push/subscribe` | 必要 | Push購読情報の登録（upsert） |
| DELETE | `/api/push/subscribe` | 必要 | Push購読の解除 |
| GET | `/api/notifications` | 必要 | 有効なアプリ内通知一覧（全ユーザー） |
| GET | `/api/admin/users` | 必要+ADMIN | 全ユーザー一覧（email 含む） |
| POST | `/api/admin/users` | 必要+ADMIN | ユーザー作成（`{ email, password, displayName }`。role は USER 固定） |
| GET | `/api/admin/groups` | 必要+ADMIN | 全グループ一覧（所属不問。各グループに `members` を含む） |
| POST | `/api/admin/groups` | 必要+ADMIN | グループ作成（`{ name }`） |
| POST | `/api/admin/groups/:groupId/members` | 必要+ADMIN | グループへユーザーを所属追加（`{ userId }`） |
| DELETE | `/api/admin/groups/:groupId/members/:userId` | 必要+ADMIN | グループからユーザーの所属を削除 |
| GET | `/api/admin/notifications` | 必要+ADMIN | アプリ内通知の全件一覧 |
| POST | `/api/admin/notifications` | 必要+ADMIN | アプリ内通知の作成 |
| PATCH | `/api/admin/notifications/:id` | 必要+ADMIN | 有効/無効の切替（`{ enabled }`） |
| DELETE | `/api/admin/notifications/:id` | 必要+ADMIN | アプリ内通知の削除 |

## requireAuth の適用箇所

認証必須の適用箇所: `src/worker/index.ts` で `/api/groups/*` 全体に `requireAuth` を一括適用し、
`/api/auth/logout`・`/me`・`PATCH /me`・`POST /password`、`/api/users/:userId`、
`/api/push/subscribe`、`/api/notifications`、`/api/admin/users`、`/api/admin/groups`、
`/api/admin/notifications` は各ルートファイル内で
個別に `requireAuth` を適用している。
`POST /api/auth/login` と `GET /api/auth/me` の `user` には `role`（`ADMIN` | `USER`）が含まれる。
管理者専用 API（`/api/admin/users`・`/api/admin/groups`・`/api/admin/notifications`）は
`requireAuth` の後に `requireAdmin`（`src/worker/middleware/requireAdmin.ts`）を重ねる。USER は 403 `{ error: "forbidden" }`。
`POST /api/admin/users` の email 重複は 409 `{ error: "email_taken" }`。既にメンバーなら 409 `{ error: "already_member" }`。
所属削除でメンバーでない場合は 404 `{ error: "not_member" }`。グループ/ユーザー不存在は 404 `{ error: "not_found" }`。
新しいエンドポイントを追加する際はどちらの方式にするか `index.ts` を確認すること。

## クライアントAPI版

ブラウザアプリとService Workerは、全APIリクエストに
`X-Client-Api-Version` を付与する。値の正本は
`shared/client-api-version.ts` の `CLIENT_API_VERSION` である。

API互換性を壊すリリースでは、同ファイルの
`MIN_SUPPORTED_CLIENT_API_VERSION` を現行クライアント版まで引き上げる。値が最小版未満、
欠落、または不正なリクエストは、認証・ルートハンドラより前に次を返し、DBなどの副作用を
実行しない。

```json
{
  "error": "client_update_required",
  "minimumClientApiVersion": "<minimum-supported-client-api-version>"
}
```

ステータスは `426 Upgrade Required`、レスポンスは `Cache-Control: no-store` とする。
ブリッジリリースでは最小版を `null` にして版検証を無効化し、更新UIを配布してから強制する。
