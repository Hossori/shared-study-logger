# API エンドポイント一覧

本ドキュメントが API 一覧の正本です。概要・機能索引は
[`.cursor/skills/shared-study-logger-overview/SKILL.md`](../.cursor/skills/shared-study-logger-overview/SKILL.md)
を参照。

| メソッド | パス | 認証 | 概要 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 不要 | ログイン（email/password検証、セッションCookie発行） |
| POST | `/api/auth/logout` | 必要 | ログアウト（KVセッション削除、Cookieクリア） |
| GET | `/api/auth/me` | 必要 | ログイン中ユーザー情報取得（`bio` / `avatarKey` 含む） |
| PATCH | `/api/auth/me` | 必要 | プロフィール更新（`displayName` / `bio` / `avatarKey`） |
| POST | `/api/auth/password` | 必要 | パスワード変更（現在のパスワード検証 + PBKDF2再ハッシュ） |
| GET | `/api/groups` | 必要 | 自分が所属するグループ一覧 |
| GET | `/api/groups/:groupId/records` | 必要+所属チェック | 記録一覧（カーソルページネーション、新しい順） |
| POST | `/api/groups/:groupId/records` | 必要+所属チェック | 記録投稿（成功時に他メンバーへPush enqueue） |
| PATCH | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の編集 |
| DELETE | `/api/groups/:groupId/records/:recordId` | 必要+所属+投稿者チェック | 自分の記録の削除 |
| GET | `/api/push/vapid-public-key` | 不要 | Push購読用のVAPID公開鍵取得 |
| POST | `/api/push/subscribe` | 必要 | Push購読情報の登録（upsert） |
| DELETE | `/api/push/subscribe` | 必要 | Push購読の解除 |

## requireAuth の適用箇所

認証必須の適用箇所: `src/worker/index.ts` で `/api/groups/*` 全体に `requireAuth` を一括適用し、
`/api/auth/logout`・`/me`・`PATCH /me`・`POST /password` と `/api/push/subscribe` は各ルート
ファイル内で個別に `requireAuth` を適用している。新しいエンドポイントを追加する際はどちらの
方式にするか `index.ts` を確認すること。
