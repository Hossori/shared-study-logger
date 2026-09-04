import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

interface ReactionSummary {
	stamp: string;
	count: number;
	reactedByMe: boolean;
}

interface StudyRecordBody {
	id: string;
	reactions: ReactionSummary[];
}

interface ReactionEntry {
	stamp: string;
	userId: string;
	displayName: string;
}

async function createRecord(
	cookie: string,
	title = "reaction-target",
): Promise<string> {
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
					title,
				}),
			},
		),
	);
	expect(createRes.status).toBe(201);
	const created = (await createRes.json()) as { record: StudyRecordBody };
	expect(created.record.reactions).toEqual([]);
	return created.record.id;
}

async function addReaction(
	cookie: string,
	recordId: string,
	stamp: string,
): Promise<Response> {
	return workerFetch(
		new Request(
			`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}/reactions`,
			{
				method: "POST",
				headers: {
					cookie,
					"content-type": "application/json",
				},
				body: JSON.stringify({ stamp }),
			},
		),
	);
}

async function listRecords(
	cookie: string,
): Promise<{ records: StudyRecordBody[] }> {
	const listRes = await workerFetch(
		new Request(
			`http://example.com/api/groups/${SEED.groupMember}/records`,
			{ headers: { cookie } },
		),
	);
	expect(listRes.status).toBe(200);
	return (await listRes.json()) as { records: StudyRecordBody[] };
}

describe("record reactions", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("lets a member add a stamp and returns summaries on the list", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(cookie);

		const addRes = await addReaction(cookie, recordId, "thumbs_up");
		expect(addRes.status).toBe(201);
		const added = (await addRes.json()) as {
			reaction: ReactionEntry;
		};
		expect(added.reaction).toEqual({
			stamp: "thumbs_up",
			userId: SEED.admin.id,
			displayName: SEED.admin.displayName,
		});

		const list = await listRecords(cookie);
		const record = list.records.find((item) => item.id === recordId);
		expect(record?.reactions).toEqual([
			{ stamp: "thumbs_up", count: 1, reactedByMe: true },
		]);
	});

	it("increments count when another member adds the same stamp", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(adminCookie);
		expect((await addReaction(adminCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		expect((await addReaction(userCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const adminList = await listRecords(adminCookie);
		expect(
			adminList.records.find((item) => item.id === recordId)?.reactions,
		).toEqual([{ stamp: "thumbs_up", count: 2, reactedByMe: true }]);

		const userList = await listRecords(userCookie);
		expect(
			userList.records.find((item) => item.id === recordId)?.reactions,
		).toEqual([{ stamp: "thumbs_up", count: 2, reactedByMe: true }]);
	});

	it("rejects duplicate stamp from the same user with 409", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(cookie);
		expect((await addReaction(cookie, recordId, "smile")).status).toBe(201);
		const duplicate = await addReaction(cookie, recordId, "smile");
		expect(duplicate.status).toBe(409);
		expect(await duplicate.json()).toEqual({ error: "already_reacted" });
	});

	it("allows the same user to add multiple stamp kinds", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(cookie);
		expect((await addReaction(cookie, recordId, "smile")).status).toBe(201);
		expect((await addReaction(cookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const list = await listRecords(cookie);
		expect(
			list.records.find((item) => item.id === recordId)?.reactions,
		).toEqual([
			{ stamp: "thumbs_up", count: 1, reactedByMe: true },
			{ stamp: "smile", count: 1, reactedByMe: true },
		]);
	});

	it("DELETE removes only the current user's row", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(adminCookie);
		expect((await addReaction(adminCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		expect((await addReaction(userCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}/reactions/thumbs_up`,
				{ method: "DELETE", headers: { cookie: adminCookie } },
			),
		);
		expect(deleteRes.status).toBe(200);

		const adminList = await listRecords(adminCookie);
		expect(
			adminList.records.find((item) => item.id === recordId)?.reactions,
		).toEqual([{ stamp: "thumbs_up", count: 1, reactedByMe: false }]);
	});

	it("DELETE of another user's stamp returns 404 and does not remove it", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(adminCookie);

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		expect((await addReaction(userCookie, recordId, "muscle")).status).toBe(
			201,
		);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}/reactions/muscle`,
				{ method: "DELETE", headers: { cookie: adminCookie } },
			),
		);
		expect(deleteRes.status).toBe(404);
		expect(await deleteRes.json()).toEqual({ error: "not_found" });

		const list = await listRecords(userCookie);
		expect(
			list.records.find((item) => item.id === recordId)?.reactions,
		).toEqual([{ stamp: "muscle", count: 1, reactedByMe: true }]);
	});

	it("returns 403 for non-members", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = "00000000-0000-4000-a000-000000000099";
		const addRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupOther}/records/${recordId}/reactions`,
				{
					method: "POST",
					headers: {
						cookie,
						"content-type": "application/json",
					},
					body: JSON.stringify({ stamp: "thumbs_up" }),
				},
			),
		);
		expect(addRes.status).toBe(403);

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupOther}/records/${recordId}/reactions`,
				{ headers: { cookie } },
			),
		);
		expect(listRes.status).toBe(403);
	});

	it("returns 400 for an invalid stamp", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(cookie);
		const addRes = await addReaction(cookie, recordId, "heart");
		expect(addRes.status).toBe(400);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}/reactions/heart`,
				{ method: "DELETE", headers: { cookie } },
			),
		);
		expect(deleteRes.status).toBe(400);
	});

	it("GET reactions lists stamp and displayName per row", async () => {
		const { cookie: adminCookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(adminCookie);
		expect((await addReaction(adminCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);
		expect((await addReaction(adminCookie, recordId, "smile")).status).toBe(
			201,
		);

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		expect((await addReaction(userCookie, recordId, "thumbs_up")).status).toBe(
			201,
		);

		const listRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}/reactions`,
				{ headers: { cookie: adminCookie } },
			),
		);
		expect(listRes.status).toBe(200);
		const body = (await listRes.json()) as { reactions: ReactionEntry[] };
		expect(body.reactions).toEqual([
			{
				stamp: "thumbs_up",
				userId: SEED.admin.id,
				displayName: SEED.admin.displayName,
			},
			{
				stamp: "smile",
				userId: SEED.admin.id,
				displayName: SEED.admin.displayName,
			},
			{
				stamp: "thumbs_up",
				userId: SEED.testUser.id,
				displayName: SEED.testUser.displayName,
			},
		]);
	});

	it("CASCADE-deletes reactions when the record is deleted", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const recordId = await createRecord(cookie);
		expect((await addReaction(cookie, recordId, "cry")).status).toBe(201);

		const deleteRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/records/${recordId}`,
				{ method: "DELETE", headers: { cookie } },
			),
		);
		expect(deleteRes.status).toBe(200);

		const leftover = await env.DB.prepare(
			"SELECT id FROM record_reactions WHERE record_id = ?",
		)
			.bind(recordId)
			.first();
		expect(leftover).toBeNull();
	});
});
