# データモデル

D1（SQLite互換）のスキーマ定義。マイグレーションの正本は [`migrations/`](../migrations/)（初期は
[`0001_init.sql`](../migrations/0001_init.sql)、以降の変更は番号付きマイグレーションを追加）。

## ER図

```mermaid
erDiagram
  users ||--o{ group_members : belongs_to
  groups ||--o{ group_members : has
  groups ||--o{ study_records : contains
  users ||--o{ study_records : authors
  users ||--o{ push_subscriptions : registers

  users {
    string id PK
    string email UK
    string password_hash
    string password_salt
    string display_name
    string bio "NULL可"
    string avatar_key "NULL可=デフォルト"
    string role "ADMIN or USER, default USER"
    string created_at
  }
  groups {
    string id PK
    string name
    string created_at
  }
  group_members {
    string group_id FK
    string user_id FK
    string joined_at
  }
  study_records {
    string id PK
    string group_id FK
    string user_id FK
    string study_datetime
    string title
    string memo
    string created_at
    string updated_at
  }
  push_subscriptions {
    string id PK
    string user_id FK
    string endpoint UK
    string p256dh
    string auth_key
    string user_agent
    string created_at
  }
```

## 補足

- `users.email`・`push_subscriptions.endpoint` は UNIQUE 制約あり。`study_records.memo`・
  `push_subscriptions.user_agent`・`users.bio`・`users.avatar_key` は NULL 許可。
- `users.avatar_key` はプリセット画像のキー（例: `avoidy` / `lavender`）。許可リストは
  `shared/avatars.ts` の `AVATAR_KEYS`。`NULL` はクライアントで Lucide アイコン（デフォルト表示）。
- `users.role` は `ADMIN` または `USER`（CHECK 制約）。既存行・列省略時のデフォルトは `USER`。
  アプリからのロール変更 API は無い。管理者にする例:
  `UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';`
- セッションは D1 ではなく **Cloudflare Workers KV**（`SESSIONS` バインディング）に保存する（`session:{token}` → `{ userId, expiresAt }`）。
- インデックス: `group_members(user_id)`、`study_records(group_id, study_datetime DESC, updated_at DESC, id DESC)`（カーソルページネーション用）、`study_records(user_id)`、`push_subscriptions(user_id)`。
- スキーマを変更する場合は `migrations/` に新しい番号のマイグレーションファイルを追加すること。適用済みの migration はすべて不変とし、変更したい場合も新しい番号の migration を追加する（既存の `0001_init.sql` は本番適用済みの可能性があるため直接編集しない）。
  - `0004_user_profile.sql`: `users` に `bio` / `avatar_key` を追加。
  - `0005_user_roles.sql`: `users` に `role`（`ADMIN` / `USER`、DEFAULT `USER`）を追加。
- 本番 D1 は `main` push 後の [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) の production release で、Time Travel の migration 前復旧ポイントを記録してから apply する。同じ job が migration 完了後に Worker をデプロイするため、Worker が新スキーマを先行して参照しない。
- rename / drop / NOT NULL 化などの破壊的変更は、旧 Worker と共存できる追加変更（expand）と旧スキーマを削除する変更（contract）を別リリースに分ける。Worker のロールバックでは D1 スキーマは戻らないため、必要時は release summary の Time Travel bookmark を使う。
