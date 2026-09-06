import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("records routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("current client can CRUD a study record in a member group", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T10:00:00.000Z",
						title: "Worker CRUD",
						memo: "memo",
					}),
				},
			),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			record: { id: string; title: string; durationMinutes: number | null };
		};
		expect(created.record.title).toBe("Worker CRUD");
		expect(created.record.durationMinutes).toBeNull();

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const list = (await listRes.json()) as {
			records: Array<{ id: string }>;
		};
		expect(list.records.some((r) => r.id === created.record.id)).toBe(true);

		const patchRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "PATCH",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T11:00:00.000Z",
						title: "Worker CRUD edited",
						memo: "updated",
						durationMinutes: 40,
					}),
				},
			),
		);
		expect(patchRes.status).toBe(200);
		const patched = (await patchRes.json()) as {
			record: { durationMinutes: number | null };
		};
		expect(patched.record.durationMinutes).toBe(40);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "DELETE",
					headers: { cookie },
				},
			),
		);
		expect(deleteRes.status).toBe(200);
	});

	it("returns 403 for non-member group", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const response = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupOther}/records`,
				{ headers: { cookie } },
			),
		);
		expect(response.status).toBe(403);
	});

	it("enqueues push messages on create when other members exist", async () => {
		const send = vi
			.spyOn(env.PUSH_QUEUE, "send")
			.mockResolvedValue(undefined as unknown as QueueSendResponse);

		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const createRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "Queue enqueue",
					}),
				},
			),
		);
		expect(createRes.status).toBe(201);
		expect(send).toHaveBeenCalled();
		const firstCall = send.mock.calls[0];
		expect(firstCall).toBeDefined();
		const payload = firstCall![0] as {
			userId: string;
			notification: { title: string };
		};
		expect(payload.userId).toBe(SEED.testUser.id);
	});

	it("accepts durationMinutes on create and rejects non-5-minute values", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createdRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "With duration",
						durationMinutes: 50,
					}),
				},
			),
		);
		expect(createdRes.status).toBe(201);
		const created = (await createdRes.json()) as {
			record: { durationMinutes: number | null };
		};
		expect(created.record.durationMinutes).toBe(50);

		const valid15Res = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "With 15-minute duration",
						durationMinutes: 15,
					}),
				},
			),
		);
		expect(valid15Res.status).toBe(201);

		const invalidRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "Invalid duration",
						durationMinutes: 7,
					}),
				},
			),
		);
		expect(invalidRes.status).toBe(400);
	});

	it("keeps durationMinutes when omitted on patch and clears it with null", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createdRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "Keep duration",
						durationMinutes: 60,
					}),
				},
			),
		);
		expect(createdRes.status).toBe(201);
		const created = (await createdRes.json()) as { record: { id: string } };

		const omitRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "PATCH",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T13:00:00.000Z",
						title: "Keep duration edited",
					}),
				},
			),
		);
		expect(omitRes.status).toBe(200);
		const omitted = (await omitRes.json()) as {
			record: { durationMinutes: number | null };
		};
		expect(omitted.record.durationMinutes).toBe(60);

		const clearRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "PATCH",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T13:00:00.000Z",
						title: "Keep duration edited",
						durationMinutes: null,
					}),
				},
			),
		);
		expect(clearRes.status).toBe(200);
		const cleared = (await clearRes.json()) as {
			record: { durationMinutes: number | null };
		};
		expect(cleared.record.durationMinutes).toBeNull();
	});

	it("rejects patch clearing studyDatetime when durationMinutes is omitted", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createdRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "Duration keep guard",
						durationMinutes: 60,
					}),
				},
			),
		);
		expect(createdRes.status).toBe(201);
		const created = (await createdRes.json()) as { record: { id: string } };

		const patchRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "PATCH",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: null,
						title: "Duration keep guard edited",
					}),
				},
			),
		);
		expect(patchRes.status).toBe(400);

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const list = (await listRes.json()) as {
			records: Array<{
				id: string;
				title: string;
				studyDatetime: string | null;
				durationMinutes: number | null;
			}>;
		};
		const stored = list.records.find((r) => r.id === created.record.id);
		expect(stored).toBeDefined();
		expect(stored!.title).toBe("Duration keep guard");
		expect(stored!.studyDatetime).toBe("2026-08-10T12:00:00.000Z");
		expect(stored!.durationMinutes).toBe(60);
	});

	it("allows patch clearing studyDatetime and durationMinutes together", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createdRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: "2026-08-10T12:00:00.000Z",
						title: "Clear both fields",
						durationMinutes: 60,
					}),
				},
			),
		);
		expect(createdRes.status).toBe(201);
		const created = (await createdRes.json()) as { record: { id: string } };

		const patchRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${created.record.id}`,
				{
					method: "PATCH",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: null,
						title: "Clear both fields edited",
						durationMinutes: null,
					}),
				},
			),
		);
		expect(patchRes.status).toBe(200);
		const patched = (await patchRes.json()) as {
			record: {
				studyDatetime: string | null;
				durationMinutes: number | null;
			};
		};
		expect(patched.record.studyDatetime).toBeNull();
		expect(patched.record.durationMinutes).toBeNull();

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const list = (await listRes.json()) as {
			records: Array<{
				id: string;
				studyDatetime: string | null;
				durationMinutes: number | null;
			}>;
		};
		const stored = list.records.find((r) => r.id === created.record.id);
		expect(stored).toBeDefined();
		expect(stored!.studyDatetime).toBeNull();
		expect(stored!.durationMinutes).toBeNull();
	});

	it("creates a record with null studyDatetime", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: null,
						title: "No datetime",
					}),
				},
			),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			record: {
				studyDatetime: string | null;
				durationMinutes: number | null;
			};
		};
		expect(created.record.studyDatetime).toBeNull();
		expect(created.record.durationMinutes).toBeNull();
	});

	it("rejects duration-only create (studyDatetime null with durationMinutes)", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({
						studyDatetime: null,
						title: "Duration only",
						durationMinutes: 30,
					}),
				},
			),
		);
		expect(createRes.status).toBe(400);

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const list = (await listRes.json()) as {
			records: Array<{ title: string }>;
		};
		expect(list.records.some((r) => r.title === "Duration only")).toBe(false);
	});

	it("sorts by COALESCE(study_datetime, created_at) DESC", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const post = (body: Record<string, unknown>) =>
			workerFetch(
				new Request(
					`http://example.com/api/groups/${SEED.groupMember}/records`,
					{
						method: "POST",
						headers: {
							cookie,
							"content-type": "application/json",
						},
						body: JSON.stringify(body),
					},
				),
			);

		const pastRes = await post({
			studyDatetime: "2000-01-01T00:00:00.000Z",
			title: "Past datetime",
		});
		expect(pastRes.status).toBe(201);

		const nullRes = await post({
			studyDatetime: null,
			title: "Null datetime",
		});
		expect(nullRes.status).toBe(201);

		const futureRes = await post({
			studyDatetime: "2099-01-01T00:00:00.000Z",
			title: "Future datetime",
		});
		expect(futureRes.status).toBe(201);

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const list = (await listRes.json()) as {
			records: Array<{ title: string }>;
		};
		const titles = list.records.map((r) => r.title);
		const futureIdx = titles.indexOf("Future datetime");
		const nullIdx = titles.indexOf("Null datetime");
		const pastIdx = titles.indexOf("Past datetime");
		expect(futureIdx).toBeGreaterThanOrEqual(0);
		expect(nullIdx).toBeGreaterThanOrEqual(0);
		expect(pastIdx).toBeGreaterThanOrEqual(0);
		expect(futureIdx).toBeLessThan(nullIdx);
		expect(nullIdx).toBeLessThan(pastIdx);
	});

	it("returns 400 for old 3-part cursor", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const legacyCursor = btoa(
			"2026-08-01T12:00:00.000Z|2026-08-01T13:00:00.000Z|record-1",
		);
		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records?cursor=${encodeURIComponent(legacyCursor)}`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(400);
	});
});
