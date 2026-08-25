import { describe, expect, it } from "vitest";
import { workerFetch } from "./helpers";

/**
 * Phase 2 進入条件: 最小 PoC（未認証 /api/auth/me → 401）。
 * これが通れば Workers 統合層を厚くする。
 */
describe("worker PoC", () => {
	it("GET /api/auth/me without cookie returns 401", async () => {
		const response = await workerFetch(
			new Request("http://example.com/api/auth/me"),
		);
		expect(response.status).toBe(401);
		const body = (await response.json()) as { error?: string };
		expect(body.error).toBe("unauthorized");
	});

	it("GET /api/ returns health JSON", async () => {
		const response = await workerFetch(
			new Request("http://example.com/api/"),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ name: "Cloudflare" });
	});
});
