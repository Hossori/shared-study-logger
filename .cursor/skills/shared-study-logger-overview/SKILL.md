---
name: shared-study-logger-overview
description: >-
  shared-study-logger のアーキテクチャ地図と機能索引を提供する
  （Workers/Hono/D1、認証・グループ・記録・Push・PWA・状態管理・ルーティングの入口）。
  リポジトリ構成やデータフローの全体像、どの reference を読むべきかを
  把握するときに使用する。エディタ警告・tsconfig・Tailwind 品質は
  reference/code-quality、設計判断は reference/design-decisions。
---

# shared-study-logger 機能ガイド

アーキテクチャ地図と機能索引。横断情報は本ファイル、機能詳細は `reference/`。*_作業対象の reference のみ読む_。セットアップは [`README.md`](/README.md)。

## 全体アーキテクチャ

単一 Worker で静的アセットと API を配信（`main`: `src/worker/index.ts`）。

```
ブラウザ(React SPA + Service Worker)
  ├─→ Static Assets (dist/client、SPAフォールバック)
  └─→ Hono API ──→ D1 (users/groups/group_members/study_records/push_subscriptions/app_notifications)
                ├─→ KV (SESSIONS)
                └─→ Queue(PUSH_QUEUE) ─→ queue() ─→ Web Push (VAPID)
```

- 同一オリジンのため Cookie 認証がシンプルで CORS 不要。
- Push は Queue 経由で非同期（投稿 API 内では同期送信しない）。

### ディレクトリ構成

```
src/
  worker/          # Hono: index.ts, routes/, lib/, middleware/
  react-app/       # React: stores/, queries/, features/, routes/, components/, lib/
shared/            # schemas.ts, avatars.ts
migrations/        # D1 スキーマ（0001〜）
public/            # sw.ts, manifest, icons/, avatars/
wrangler.jsonc / vite.config.ts
```

## 機能ごとの整理

| #   | 機能             | 概要                                                       | 詳細                                                           |
| --- | ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | 認証・セッション | Cookie(`session`)。マイページでプロフィール/パスワード変更 | [reference/auth.md](reference/auth.md)                         |
| 2   | グループ         | 所属グループの記録のみ閲覧。作成・所属は管理者画面で操作 | [reference/groups.md](reference/groups.md)                     |
| 3   | 学習記録         | 投稿・編集・削除、カーソルページネーション                 | [reference/records.md](reference/records.md)                   |
| 4   | Push通知         | 投稿時に他メンバーへ Web Push（VAPID）                     | [reference/push.md](reference/push.md)                         |
| 5   | PWA              | ホーム画面追加、SW、Push 受信                              | [reference/pwa.md](reference/pwa.md)                           |
| 6   | 状態管理         | Zustand（クライアント）+ TanStack Query（サーバー）        | [reference/state-management.md](reference/state-management.md) |
| 7   | ルーティング     | react-router data router、認証ガード                       | [reference/routing.md](reference/routing.md)                   |

## データモデル（D1 / SQLite）

テーブルは `users` / `groups` / `group_members` / `study_records` / `push_subscriptions` / `app_notifications` の6つ。
`users.role` は `ADMIN` または `USER`（既存行・未指定は `USER`）。セッションは Workers KV（`SESSIONS`）。スキーマ変更は `migrations/` に新規番号を追加（`0001_init.sql`は直接編集しない）。
詳細は [docs/data-model.md](/docs/data-model.md)。

## API

正本は [docs/api.md](/docs/api.md)。`requireAuth` は `index.ts` で `/api/groups/*` に一括適用し、
auth/push/notifications の一部は各ルートファイル内で個別適用する。`/api/admin/users`・
`/api/admin/groups`・`/api/admin/notifications` は `requireAuth` + `requireAdmin`。

## ビルド・検証

```bash
pnpm exec tsc -b   # 型チェック（または pnpm run typecheck）
pnpm build         # 本番ビルド
pnpm lint          # ESLint
pnpm run format:check  # Prettier（CI Quality でも必須。詳細は code-quality）
pnpm test          # Vitest unit
pnpm test:worker   # Workers 統合（PoC成功済み）
pnpm test:e2e      # Playwright スモーク（要 pnpm seed）
pnpm dev           # ローカル開発
```

テスト方針は [testing-strategy](../testing-strategy/SKILL.md)。
format / pre-commit は[reference/code-quality.md](reference/code-quality.md)。
その他（seed・マイグレーション等）は [`README.md`](/README.md)。

## コード品質・設計判断

- [reference/code-quality.md](reference/code-quality.md)
- [reference/design-decisions.md](reference/design-decisions.md)

## 既知の制約

- **Cookie Secure**: [reference/auth.md](reference/auth.md) を参照。
- **`@hono/zod-validator` は未導入（意図的）**: 各ルートで `schema.safeParse(json)`。新エンドポイントも同パターン。

## 更新すべきタイミング

API・データモデル・状態管理・主要ライブラリ変更時は本ファイルと対応する `reference/*.md` / `docs/*.md` を更新。
コード品質の知見は [code-quality.md](reference/code-quality.md) に追記。
