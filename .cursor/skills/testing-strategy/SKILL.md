---
name: testing-strategy
description: >-
  shared-study-logger のテスト自動化方針（Vitest unit/worker、Playwright スモーク ≤7、
  CI ゲート、seed/Cookie 前提、Push/PWA 手動除外）をまとめる。
  テスト追加・修正、CI ワークフロー変更、Vitest/Playwright 導入、
  自動化可否の判断、フレーク調査時に参照する。
---

# テスト戦略（案B）

Vitest を主戦場、Playwright は薄いスモーク（≤7本）。アーキテクチャ全体は overview Skill、
Zod フォーマットは zod-schemas Skill を参照（本 Skill と重複させない）。

## ピラミッド

| 層 | ツール | 配置 | CI / script |
| --- | --- | --- | --- |
| unit | Vitest (Node) | `tests/unit/**` | `pnpm test`（必須） |
| worker | `@cloudflare/vitest-pool-workers` | `tests/worker/**` | `pnpm test:worker`（必須・PoC成功済み） |
| e2e | Playwright | `e2e/**` | `pnpm test:e2e`（スモーク ≤7） |

```bash
pnpm test              # unit
pnpm test:watch        # unit watch
pnpm test:worker       # Workers 統合
pnpm test:e2e          # Playwright スモーク（要 seed。初回は pnpm playwright:install）
pnpm playwright:install # Chromium + chromium-headless-shell を %LOCALAPPDATA%\ms-playwright へ
pnpm run typecheck     # tsc -b（app/node/worker/sw + tests/unit + tests/worker）
pnpm lint && pnpm run format:check && pnpm run check:zod-deprecated
```

## 書く / 書かない

**書く**

- 純関数・スキーマ・カーソル・日時変換・認証ハッシュ等（unit）
- API 代表経路: login/logout/me、記録 CRUD、非所属 403、Queue `send` mock（worker）
- Cookie セッション前提の UI スモーク: ログイン成否、グループ、記録 CRUD、logout、未認証リダイレクト（e2e）

**書かない（手動）**

- Web Push 実送信・購読 UI・VAPID 実機
- PWA インストール / Service Worker / オフライン
- iOS Safari standalone・実機 Push

手動チェックリスト: [manual-checklist.md](manual-checklist.md)。

## seed / Cookie 前提

- 固定アカウント。E2E・ローカル確認は `pnpm seed`（または `pnpm seed:reset`）後の
  `admin@example.com` / `ChangeMe123!`（および `test@example.com`）を使う。
- セッション Cookie 名 `session`（httpOnly）。同一オリジンのため CORS なし。
- ローカル HTTP では `Secure` オフ（本番 HTTPS ではオン）。詳細は overview の auth reference。

## Phase 2（Workers）— PoC 成功済み

進入条件だった最小 PoC（未認証 `GET /api/auth/me` → 401、`GET /api/`）は **成功**。
以降 worker 層は CI 必須。

- 設定: `wrangler.test.jsonc`（assets 無し）+ `vitest.worker.config.ts`
- マイグレーション: `readD1Migrations` → binding `TEST_MIGRATIONS` →
  `tests/worker/apply-migrations.ts` で `applyD1Migrations`
- ランタイム: `import { env, exports } from "cloudflare:workers"` /
  `applyD1Migrations` は `cloudflare:test`
- Queue 実 Push はしない。`env.PUSH_QUEUE.send` の呼び出し確認（mock）に留める

退避方針（将来 PoC 相当が壊れた場合）: worker ジョブを一時 skip し Node unit を厚くして
e2e で契約を担保。理由を本節と `tests/worker/README.md` に残す。

## E2E（Playwright）

- **上限 7本**（現行 6本: `e2e/smoke.spec.ts`）。超えるなら unit/worker へ落とす。
- Push/PWA 禁止。フレーク（固定 sleep・networkidle 濫用）禁止。locator / response wait のみ。
- `webServer`: `vite --host 127.0.0.1`（`playwright.config.ts`）
- **`serviceWorkers: "block"`** 必須（dev の vite-plugin-pwa SW が API を阻害するため）
- 前提手順の短記: `e2e/README.md`（初回 `pnpm playwright:install`。Cursor エージェントの `PLAYWRIGHT_BROWSERS_PATH` 一時パス注意）

## フレーク禁止事項

- 固定 `waitForTimeout` 依存
- 外部ネットワーク・実 Push 依存
- 時刻・乱数に脆いアサーション（必要なら固定値）
- worker でファイル横断の共有 DB 破壊書き込み

## 既知制約

- **CI は ubuntu**（ローカルは Windows 可）。Actions と Windows ローカル Wrangler D1 の差があり得る。
- Windows で `wrangler d1` / ローカル SQLite が失敗する場合は WSL または CI を正とする。
- Worker テストは `dist/client` assets を前提にしない（`wrangler.test.jsonc`）。
- E2E 前に migrations apply + `pnpm seed` + `.dev.vars`（VAPID_*）が必要。初回 `pnpm playwright:install`（既定の `%LOCALAPPDATA%\ms-playwright`。エージェントの `PLAYWRIGHT_BROWSERS_PATH` 注意）。

## 変更時の手順（短い）

1. 純関数 → `tests/unit` → `pnpm test`
2. API → `pnpm test:worker`（migrations setup 維持）
3. 画面 → e2e 本数を数え ≤7 → `pnpm test:e2e`
4. 静的ゲート → `pnpm run typecheck` / `lint` / `format:check` / `check:zod-deprecated`
