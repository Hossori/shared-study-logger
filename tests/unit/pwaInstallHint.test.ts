import { describe, expect, it } from "vitest";
import { iosHomeScreenInstallHint } from "../../src/react-app/lib/iosHomeScreenInstallHint";

const UA = {
	safari:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
	chrome:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
	firefox:
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15",
	edge: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.2210.105 Mobile/15E148 Safari/605.1.15",
	desktopChrome:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

describe("iosHomeScreenInstallHint", () => {
	it("returns Safari hint for iPhone Safari UA", () => {
		expect(iosHomeScreenInstallHint(UA.safari)).toBe(
			"Safari の共有ボタン →「ホーム画面に追加」",
		);
	});

	it("returns Chrome hint for iPhone CriOS UA (includes Safari token)", () => {
		expect(iosHomeScreenInstallHint(UA.chrome)).toBe(
			"Chrome の共有ボタン →「ホーム画面に追加」",
		);
	});

	it("returns Firefox hint for iPhone FxiOS UA", () => {
		expect(iosHomeScreenInstallHint(UA.firefox)).toBe(
			"Firefox の共有ボタン →「ホーム画面に追加」",
		);
	});

	it("returns Edge hint for iPhone EdgiOS UA", () => {
		expect(iosHomeScreenInstallHint(UA.edge)).toBe(
			"Edge の共有ボタン →「ホーム画面に追加」",
		);
	});

	it("returns generic hint for empty or unknown UA", () => {
		const generic = "ブラウザの共有ボタン →「ホーム画面に追加」";
		expect(iosHomeScreenInstallHint("")).toBe(generic);
		expect(iosHomeScreenInstallHint("Mozilla/5.0 (unknown)")).toBe(generic);
	});

	it("returns generic hint for desktop Chrome UA (not misidentified as Safari)", () => {
		expect(iosHomeScreenInstallHint(UA.desktopChrome)).toBe(
			"ブラウザの共有ボタン →「ホーム画面に追加」",
		);
	});
});
