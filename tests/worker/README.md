# Workers 統合テスト

`@cloudflare/vitest-pool-workers` + `wrangler.test.jsonc`（assets 無し）で API を検証する。

```bash
pnpm test:worker
```

マイグレーションは `vitest.worker.config.ts` の `TEST_MIGRATIONS` + `apply-migrations.ts`。
Push 実送信は対象外。Queue は `PUSH_QUEUE.send` の呼び出し確認（mock）に留める。

方針の正本: `.cursor/skills/testing-strategy/SKILL.md`
