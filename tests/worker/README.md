# Workers 統合テスト

`@cloudflare/vitest-pool-workers` + `wrangler.test.jsonc`（assets 無し）で API を検証する。

```bash
pnpm test:worker
```

マイグレーションは `vitest.worker.config.ts` の `TEST_MIGRATIONS` + `apply-migrations.ts`。
Queue は `PUSH_QUEUE.send` の呼び出し確認（mock）。

方針の正本: [docs/testing.md](../../docs/testing.md)
