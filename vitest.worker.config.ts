import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	cloudflareTest,
	readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		cloudflareTest(async () => {
			const migrations = await readD1Migrations(
				path.join(root, "migrations"),
			);
			return {
				wrangler: { configPath: path.join(root, "wrangler.test.jsonc") },
				miniflare: {
					bindings: {
						TEST_MIGRATIONS: migrations,
						VAPID_PUBLIC_KEY: "test-vapid-public-key",
						VAPID_PRIVATE_KEY:
							'{"kty":"EC","crv":"P-256","x":"x","y":"y","d":"d"}',
						VAPID_ADMIN_CONTACT: "mailto:test@example.com",
					},
				},
			};
		}),
	],
	test: {
		name: "worker",
		include: ["tests/worker/**/*.test.ts"],
		setupFiles: [path.join(root, "tests/worker/apply-migrations.ts")],
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
