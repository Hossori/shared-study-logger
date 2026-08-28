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

	it("accepts durationMinutes on create and rejects non-10-minute values", async () => {
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
						durationMinutes: 15,
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
});
