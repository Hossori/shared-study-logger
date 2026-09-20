# テスト

Vitest を主戦場、Playwright は薄いスモーク（≤7本）。地図は [architecture.md](architecture.md)。Zod フォーマットは [zod-schemas](../.agents/skills/zod-schemas/SKILL.md)。手動確認は [manual-checklist.md](manual-checklist.md)。

## 層

| 層 | ツール | 配置 | コマンド |
| -- | ------ | ---- | -------- |
| unit | Vitest (Node) | `tests/unit/**` | `pnpm test` |
| worker | `@cloudflare/vitest-pool-workers` | `tests/worker/**` | `pnpm test:worker` |
| e2e | Playwright | `e2e/**` | `pnpm test:e2e`（スモーク ≤7） |

```bash
pnpm test
pnpm test:watch
pnpm test:worker
pnpm test:e2e
pnpm playwright:install
pnpm run typecheck
pnpm lint
pnpm run format:check
pnpm run check:zod-deprecated
pnpm run check:d1-migrations
```

## 自動化する範囲

- unit: 純関数・スキーマ・カーソル・日時変換・認証ハッシュ
- worker: login / logout / me、記録 CRUD、非所属 403、Queue `send` の mock
- e2e: Cookie セッション前提のログイン、グループ、記録 CRUD、logout、未認証リダイレクト

Push 実送信・購読 UI・PWA / Service Worker / iOS 実機は [manual-checklist.md](manual-checklist.md)。

## seed / Cookie

開発用アカウントは [README.md](../README.md)。Cookie 名は `session`（httpOnly）。同一オリジン。`Secure` の切り替えは [features/auth.md](features/auth.md)。

## Workers

- 設定: `wrangler.test.jsonc`（assets 無し）+ `vitest.worker.config.ts`
- マイグレーション: `readD1Migrations` → binding `TEST_MIGRATIONS` → `tests/worker/apply-migrations.ts` で `applyD1Migrations`
- ランタイム: `import { env, exports } from "cloudflare:workers"`。`applyD1Migrations` は `cloudflare:test`
- Queue は `env.PUSH_QUEUE.send` の呼び出し確認（mock）

実行の短記は [tests/worker/README.md](../tests/worker/README.md)。

## E2E（Playwright）

実行手順は [e2e/README.md](../e2e/README.md)。

- `webServer`: `vite --host 127.0.0.1`（`playwright.config.ts`）
- `serviceWorkers: "block"`（dev の vite-plugin-pwa SW が API を阻害するため）
- 待ちは locator / response。固定 `waitForTimeout` や `networkidle` に依存しない

## 安定して通す

- 時刻・乱数が必要なアサーションは固定値にする
- worker の DB 書き込みはテスト間で隔離する
- CI は ubuntu。Windows で `wrangler d1` が失敗する場合は WSL または CI を正とする

## 変更時

1. 純関数 → `tests/unit` → `pnpm test`
2. API → `pnpm test:worker`
3. 画面 → `pnpm test:e2e`
4. 下表のゲート

## コミット前ゲート

コード変更をコミットする前に、次をすべて成功させる。

| コマンド | 目的 |
| -------- | ---- |
| `pnpm test` | Vitest unit |
| `pnpm test:e2e` | Playwright スモーク（seed / `.dev.vars` / 初回は `pnpm playwright:install`） |
| `pnpm lint` | ESLint |
| `pnpm run format:check` | Prettier と Tailwind クラス順序 |
| `pnpm run check:zod-deprecated` | Zod の文字列フォーマット API |
| `pnpm run check:d1-migrations` | D1: CASCADE 親 DROP の子退避漏れ |
| `pnpm run typecheck` | `tsc -b` |

- 画面契約（UI・アクセシブルネーム・ルーティング・記録 CRUD）に触れる変更では `pnpm test:e2e` を含める
- API / Worker 契約の変更では `pnpm test:worker` を含める
- ドキュメントのみなどコードに影響しない変更は省略可。判断に迷う場合は実行する
