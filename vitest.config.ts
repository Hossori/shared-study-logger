import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@shared": path.resolve(root, "./shared"),
		},
	},
	test: {
		name: "unit",
		include: ["tests/unit/**/*.test.ts"],
		environment: "node",
	},
});
