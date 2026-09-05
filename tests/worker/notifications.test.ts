import { beforeEach, describe, expect, it } from "vitest";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("in-app notification routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("rejects unauthenticated access with 401", async () => {
		const enabledRes = await workerFetch(
			new Request("http://example.com/api/notifications"),
		);
		expect(enabledRes.status).toBe(401);

		const adminRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications"),
		);
		expect(adminRes.status).toBe(401);
	});

	it("forbids USER on admin CRUD with 403", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);

		const listRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				headers: { cookie },
			}),
		);
		expect(listRes.status).toBe(403);
		const listBody = (await listRes.json()) as { error: string };
		expect(listBody.error).toBe("forbidden");

		const createRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ title: "x", body: "y" }),
			}),
		);
		expect(createRes.status).toBe(403);
	});

	it("lets ADMIN create, list, toggle, and delete", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);

		const createRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				method: "POST",
				headers: {
					cookie: adminCookie,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					title: "メンテナンス",
					body: "今夜実施します",
				}),
			}),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			notification: {
				id: string;
				title: string;
				enabled: boolean;
				createdBy: string;
			};
		};
		expect(created.notification.title).toBe("メンテナンス");
		expect(created.notification.enabled).toBe(true);
		expect(created.notification.createdBy).toBe(SEED.admin.id);

		const adminListRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				headers: { cookie: adminCookie },
			}),
		);
		expect(adminListRes.status).toBe(200);
		const adminList = (await adminListRes.json()) as {
			notifications: Array<{ id: string }>;
		};
		expect(
			adminList.notifications.some((n) => n.id === created.notification.id),
		).toBe(true);

		const enabledRes = await workerFetch(
			new Request("http://example.com/api/notifications", {
				headers: { cookie: userCookie },
			}),
		);
		expect(enabledRes.status).toBe(200);
		const enabled = (await enabledRes.json()) as {
			notifications: Array<{ id: string }>;
		};
		expect(
			enabled.notifications.some((n) => n.id === created.notification.id),
		).toBe(true);

		const disableRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/notifications/${created.notification.id}`,
				{
					method: "PATCH",
					headers: {
						cookie: adminCookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({ enabled: false }),
				},
			),
		);
		expect(disableRes.status).toBe(200);
		const disabled = (await disableRes.json()) as {
			notification: { enabled: boolean };
		};
		expect(disabled.notification.enabled).toBe(false);

		const enabledAfterDisable = await workerFetch(
			new Request("http://example.com/api/notifications", {
				headers: { cookie: userCookie },
			}),
		);
		const enabledAfter = (await enabledAfterDisable.json()) as {
			notifications: Array<{ id: string }>;
		};
		expect(
			enabledAfter.notifications.some(
				(n) => n.id === created.notification.id,
			),
		).toBe(false);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/notifications/${created.notification.id}`,
				{
					method: "DELETE",
					headers: { cookie: adminCookie },
				},
			),
		);
		expect(deleteRes.status).toBe(200);

		const missingRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/notifications/${created.notification.id}`,
				{
					method: "DELETE",
					headers: { cookie: adminCookie },
				},
			),
		);
		expect(missingRes.status).toBe(404);
	});

	it("rejects invalid create payloads with 400", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const res = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ title: "", body: "x" }),
			}),
		);
		expect(res.status).toBe(400);
	});

	it("stores markdown link syntax in the body as-is", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);

		const body = "詳細は[こちら](https://example.com/notice)";
		const createRes = await workerFetch(
			new Request("http://example.com/api/admin/notifications", {
				method: "POST",
				headers: {
					cookie: adminCookie,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					title: "リンク付き",
					body,
				}),
			}),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			notification: { id: string; body: string };
		};
		expect(created.notification.body).toBe(body);

		const enabledRes = await workerFetch(
			new Request("http://example.com/api/notifications", {
				headers: { cookie: userCookie },
			}),
		);
		expect(enabledRes.status).toBe(200);
		const enabled = (await enabledRes.json()) as {
			notifications: Array<{ id: string; body: string }>;
		};
		const match = enabled.notifications.find(
			(n) => n.id === created.notification.id,
		);
		expect(match?.body).toBe(body);
	});
});
