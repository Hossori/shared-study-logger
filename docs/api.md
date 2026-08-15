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
| GET | `/api/groups/:groupId/records` | 必要+所属チェック | 記録一覧（カーソルページネーション、新しい順） |
| POST | `/api/groups/:groupId/records` | 必要+所属チェック | 記録投稿（成功時に他メンバーへPush enqueue） |
| PATCH | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の編集 |
| DELETE | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の削除 |
| GET | `/api/push/vapid-public-key` | 不要 | Push購読用のVAPID公開鍵取得 |
| POST | `/api/push/subscribe` | 必要 | Push購読情報の登録（upsert） |
| DELETE | `/api/push/subscribe` | 必要 | Push購読の解除 |
| GET | `/api/notifications` | 必要 | 有効なアプリ内通知一覧（全ユーザー） |
| GET | `/api/admin/notifications` | 必要+ADMIN | アプリ内通知の全件一覧 |
| POST | `/api/admin/notifications` | 必要+ADMIN | アプリ内通知の作成 |
| PATCH | `/api/admin/notifications/:id` | 必要+ADMIN | 有効/無効の切替（`{ enabled }`） |
| DELETE | `/api/admin/notifications/:id` | 必要+ADMIN | アプリ内通知の削除 |

## requireAuth の適用箇所

認証必須の適用箇所: `src/worker/index.ts` で `/api/groups/*` 全体に `requireAuth` を一括適用し、
`/api/auth/logout`・`/me`・`PATCH /me`・`POST /password`、`/api/users/:userId`、
`/api/push/subscribe`、`/api/notifications`、`/api/admin/notifications` は各ルートファイル内で
個別に `requireAuth` を適用している。
`POST /api/auth/login` と `GET /api/auth/me` の `user` には `role`（`ADMIN` | `USER`）が含まれる。
管理者専用 API（`/api/admin/notifications`）は `requireAuth` の後に `requireAdmin`（`src/worker/middleware/requireAdmin.ts`）を重ねる。USER は 403 `{ error: "forbidden" }`。
新しいエンドポイントを追加する際はどちらの方式にするか `index.ts` を確認すること。
