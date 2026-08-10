/**
 * Worker テスト用の追加バインディング型。
 * `TEST_MIGRATIONS` は vitest.worker.config.ts でのみ注入する。
 * 公式 fixture と同様に Cloudflare.Env を拡張する
 * （`import { env } from "cloudflare:workers"` の型は Cloudflare.Env）。
 */
/// <reference types="@cloudflare/vitest-pool-workers/types" />

declare namespace Cloudflare {
	interface Env {
		TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
	}
}
