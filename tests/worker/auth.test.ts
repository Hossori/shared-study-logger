import { beforeEach, describe, expect, it } from "vitest";
import { exports } from "cloudflare:workers";
import { loginAs, SEED, seedMinimalDb } from "./helpers";

const workerFetch = exports.default.fetch.bind(exports.default);

describe("auth routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("login succeeds and me returns user", async () => {
		const { cookie, response: loginRes } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		expect(loginRes.status).toBe(200);

		const meRes = await workerFetch(
			new Request("http://example.com/api/auth/me", {
				headers: { cookie },
			}),
		);
		expect(meRes.status).toBe(200);
		const body = (await meRes.json()) as {
			user: { email: string; displayName: string };
		};
		expect(body.user.email).toBe(SEED.admin.email);
		expect(body.user.displayName).toBe(SEED.admin.displayName);
	});

	it("login rejects bad password", async () => {
		const response = await workerFetch(
			new Request("http://example.com/api/auth/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					email: SEED.admin.email,
					password: "wrong-password",
				}),
			}),
		);
		expect(response.status).toBe(401);
	});

	it("logout clears session", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const logoutRes = await workerFetch(
			new Request("http://example.com/api/auth/logout", {
				method: "POST",
				headers: { cookie },
			}),
		);
		expect(logoutRes.status).toBe(200);

		const meRes = await workerFetch(
			new Request("http://example.com/api/auth/me", {
				headers: { cookie },
			}),
		);
		expect(meRes.status).toBe(401);
	});
});
