# アーキテクチャ

単一 Worker で静的アセットと API を配信する（`src/worker/index.ts`）。セットアップとデプロイは [README.md](../README.md)。

```
ブラウザ(React SPA + Service Worker)
  ├─→ Static Assets (dist/client、SPAフォールバック)
  └─→ Hono API ──→ D1 (users/groups/group_members/study_records/record_reactions/push_subscriptions/app_notifications)
                ├─→ KV (SESSIONS)
                └─→ Queue(PUSH_QUEUE) ─→ queue() ─→ Web Push (VAPID)
```

同一オリジンの Cookie 認証。Push は Queue 経由で非同期。バリデーションは各ルートで `schema.safeParse`。

作業対象の機能ドキュメントだけ読む。

## ディレクトリ

```
src/worker/       # Hono: index.ts, routes/, lib/, middleware/
src/react-app/    # stores/, queries/, features/, routes/, components/, lib/
shared/           # schemas.ts, avatars.ts
migrations/
public/           # sw.ts, manifest, icons/, avatars/
```

## 機能索引

| 機能 | 概要 | 詳細 |
| ---- | ---- | ---- |
| 認証・セッション | Cookie(`session`)。マイページでプロフィール / パスワード / Push 設定 | [features/auth.md](features/auth.md) |
| グループ | 所属グループの記録のみ閲覧。作成・所属は管理者画面 | [features/groups.md](features/groups.md) |
| 学習記録 | 投稿・編集・削除、カーソルページネーション、スタンプ | [features/records.md](features/records.md) |
| Push 通知 | 投稿時に他メンバーへ Web Push（VAPID） | [features/push.md](features/push.md) |
| PWA | ホーム画面追加、SW、Push 受信 | [features/pwa.md](features/pwa.md) |
| 状態管理 | Zustand（クライアント）+ TanStack Query（サーバー） | [features/state-management.md](features/state-management.md) |
| ルーティング | react-router data router、認証ガード | [features/routing.md](features/routing.md) |

## 関連正本

- API: [api.md](api.md)
- データモデル: [data-model.md](data-model.md)
- テストとコミット前ゲート: [testing.md](testing.md)
- 設計判断: [design-decisions.md](design-decisions.md)
- コード品質: [code-quality.md](code-quality.md)

API・データモデル・状態管理・主要ライブラリを変えたら本ファイルと対応する `docs/` を更新する。
