import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { env, exports } from "cloudflare:workers";
import {
	CLIENT_API_VERSION,
	CLIENT_API_VERSION_HEADER,
	MIN_SUPPORTED_CLIENT_API_VERSION,
} from "../../shared/client-api-version";
import { createRequireClientApiVersion } from "../../src/worker/middleware/requireClientApiVersion";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

function createVersionProtectedApp() {
	const app = new Hono<{ Bindings: Env }>();
	app.use(
		"/api/*",
		createRequireClientApiVersion(MIN_SUPPORTED_CLIENT_API_VERSION),
	);
	app.post("/api/groups/:groupId/records", async (c) => {
		await c.env.DB.prepare(
			`INSERT INTO study_records (
				id, group_id, user_id, study_date, title, duration_minutes, memo
			) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(
				"00000000-0000-4000-a000-000000000099",
				SEED.groupMember,
				SEED.admin.id,
				"2026-08-15T00:00:00.000Z",
				"拒否される記録",
				30,
				null,
			)
			.run();
		return c.json({ created: true }, 201);
	});
	return app;
}

describe("client API version middleware", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("requires the current version header on real API requests", async () => {
		const missing = await exports.default.fetch(
			new Request("http://example.com/api/"),
		);
		expect(missing.status).toBe(426);

		const response = await exports.default.fetch(
			new Request("http://example.com/api/", {
				headers: { [CLIENT_API_VERSION_HEADER]: CLIENT_API_VERSION },
			}),
		);

		expect(response.status).toBe(200);
	});

	it.each([
		["missing", undefined],
		["non-numeric", "not-a-version"],
		["below minimum", "1.9.9"],
	])("returns 426 for a %s client version", async (_description, version) => {
		const app = createVersionProtectedApp();
		const response = await app.fetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: version ? { [CLIENT_API_VERSION_HEADER]: version } : undefined,
				},
			),
			env,
		);

		expect(response.status).toBe(426);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		await expect(response.json()).resolves.toEqual({
			error: "client_update_required",
			minimumClientApiVersion: MIN_SUPPORTED_CLIENT_API_VERSION,
		});
	});

	it.each(["/api/auth/login", "/api/push/subscribe"])(
		"rejects a stale request to %s",
		async (path) => {
			const app = new Hono<{ Bindings: Env }>();
			app.use(
				"/api/*",
				createRequireClientApiVersion(MIN_SUPPORTED_CLIENT_API_VERSION),
			);
			app.post("/api/auth/login", (c) => c.json({ reached: true }));
			app.post("/api/push/subscribe", (c) => c.json({ reached: true }));

			const response = await app.fetch(
				new Request(`http://example.com${path}`, {
					method: "POST",
					headers: { [CLIENT_API_VERSION_HEADER]: "1.9.9" },
				}),
				env,
			);

			expect(response.status).toBe(426);
		},
	);

	it.each([
		["missing", undefined],
		["stale", "1.9.9"],
	])("rejects a %s POST before it writes to D1", async (_description, version) => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const before = await env.DB.prepare(
			"SELECT COUNT(*) AS count FROM study_records",
		).first<{ count: number }>();

		const response = await exports.default.fetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
						...(version
							? { [CLIENT_API_VERSION_HEADER]: version }
							: {}),
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-15T00:00:00.000Z",
						title: "拒否される記録",
					}),
				},
			),
		);

		const after = await env.DB.prepare(
			"SELECT COUNT(*) AS count FROM study_records",
		).first<{ count: number }>();
		expect(response.status).toBe(426);
		expect(after?.count).toBe(before?.count);
	});

	it.each([
		["missing", undefined],
		["stale", "1.9.9"],
	])(
		"rejects a %s login before issuing a session",
		async (_description, version) => {
			const response = await exports.default.fetch(
				new Request("http://example.com/api/auth/login", {
					method: "POST",
					headers: {
						"content-type": "application/json",
						...(version
							? { [CLIENT_API_VERSION_HEADER]: version }
							: {}),
					},
					body: JSON.stringify({
						email: SEED.admin.email,
						password: SEED.admin.password,
					}),
				}),
			);

			expect(response.status).toBe(426);
			expect(response.headers.get("set-cookie")).toBeNull();
		},
	);
});
