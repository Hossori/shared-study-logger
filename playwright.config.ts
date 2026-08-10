import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 5173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		// 開発時 SW（vite-plugin-pwa）が API を阻害しないようにする
		serviceWorkers: "block",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `pnpm exec vite --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
