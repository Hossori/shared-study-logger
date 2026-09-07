import { beforeEach, describe, expect, it } from "vitest";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("groups routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("returns group members for a member user", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const response = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/members`,
				{ headers: { cookie } },
			),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			members: Array<Record<string, unknown>>;
		};
		expect(body.members).toHaveLength(2);
		expect(body.members[0]).toEqual({
			id: SEED.admin.id,
			displayName: SEED.admin.displayName,
			avatarKey: null,
		});
		expect(body.members[1]).toEqual({
			id: SEED.testUser.id,
			displayName: SEED.testUser.displayName,
			avatarKey: null,
		});
		for (const member of body.members) {
			expect(member).not.toHaveProperty("email");
			expect(member).not.toHaveProperty("bio");
		}
	});

	it("returns 403 for non-member group", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const response = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupOther}/members`,
				{ headers: { cookie } },
			),
		);
		expect(response.status).toBe(403);
	});

	it("allows test user to list members of their group", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		const memberRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupMember}/members`,
				{ headers: { cookie } },
			),
		);
		expect(memberRes.status).toBe(200);

		const otherRes = await workerFetch(
			new Request(
				`http://example.com/api/groups/${SEED.groupOther}/members`,
				{ headers: { cookie } },
			),
		);
		expect(otherRes.status).toBe(403);
	});
});
