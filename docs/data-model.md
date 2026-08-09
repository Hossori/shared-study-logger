# データモデル

D1（SQLite互換）のスキーマ定義。マイグレーションの正本は [`migrations/0001_init.sql`](../migrations/0001_init.sql)。

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
    string study_date
    string title
    int duration_minutes
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

- `users.email`・`push_subscriptions.endpoint` は UNIQUE 制約あり。`study_records.memo`・`push_subscriptions.user_agent` は NULL 許可。
- セッションは D1 ではなく **Cloudflare Workers KV**（`SESSIONS` バインディング）に保存する（`session:{token}` → `{ userId, expiresAt }`）。
- インデックス: `group_members(user_id)`、`study_records(group_id, created_at DESC)`（カーソルページネーション用）、`study_records(user_id)`、`push_subscriptions(user_id)`。
- スキーマを変更する場合は `migrations/` に新しい番号のマイグレーションファイルを追加すること（既存の `0001_init.sql` は本番適用済みの可能性があるため直接編集しない）。
