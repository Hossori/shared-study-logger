import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { requireAdmin } from "../../src/worker/middleware/requireAdmin";
import {
	requireAuth,
	type AuthVariables,
} from "../../src/worker/middleware/requireAuth";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("auth routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("current client can log in and retrieve the authenticated user", async () => {
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
			user: { email: string; displayName: string; role: string };
		};
		expect(body.user.email).toBe(SEED.admin.email);
		expect(body.user.displayName).toBe(SEED.admin.displayName);
		expect(body.user.role).toBe("ADMIN");
	});

	it("login and me return USER when role column uses DEFAULT", async () => {
		const { cookie, response: loginRes } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		expect(loginRes.status).toBe(200);
		const loginBody = (await loginRes.json()) as {
			user: { email: string; role: string };
		};
		expect(loginBody.user.email).toBe(SEED.testUser.email);
		expect(loginBody.user.role).toBe("USER");

		const dbRole = await env.DB.prepare("SELECT role FROM users WHERE id = ?")
			.bind(SEED.testUser.id)
			.first<{ role: string }>();
		expect(dbRole?.role).toBe("USER");

		const meRes = await workerFetch(
			new Request("http://example.com/api/auth/me", {
				headers: { cookie },
			}),
		);
		expect(meRes.status).toBe(200);
		const meBody = (await meRes.json()) as { user: { role: string } };
		expect(meBody.user.role).toBe("USER");
	});

	it("rejects invalid role values at the DB CHECK", async () => {
		await expect(
			env.DB.prepare("UPDATE users SET role = ? WHERE id = ?")
				.bind("SUPERUSER", SEED.testUser.id)
				.run(),
		).rejects.toThrow();
	});

	it("requireAdmin allows ADMIN and forbids USER", async () => {
		const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
		app.get("/ping", requireAuth, requireAdmin, (c) => c.json({ ok: true }));

		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const adminRes = await app.fetch(
			new Request("http://example.com/ping", {
				headers: { cookie: adminCookie },
			}),
			env,
		);
		expect(adminRes.status).toBe(200);

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		const userRes = await app.fetch(
			new Request("http://example.com/ping", {
				headers: { cookie: userCookie },
			}),
			env,
		);
		expect(userRes.status).toBe(403);
		const body = (await userRes.json()) as { error: string };
		expect(body.error).toBe("forbidden");
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
