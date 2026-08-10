/**
 * D1 マイグレーション適用（ファイル単位で安全に再実行可）。
 * TEST_MIGRATIONS は vitest.worker.config.ts で注入する。
 */
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
