import { beforeEach, describe, expect, it } from "vitest";
import { loginAs, SEED, seedMinimalDb, workerFetch } from "./helpers";

describe("admin directory routes", () => {
	beforeEach(async () => {
		await seedMinimalDb();
	});

	it("rejects unauthenticated access with 401", async () => {
		const usersRes = await workerFetch(
			new Request("http://example.com/api/admin/users"),
		);
		expect(usersRes.status).toBe(401);

		const groupsRes = await workerFetch(
			new Request("http://example.com/api/admin/groups"),
		);
		expect(groupsRes.status).toBe(401);
	});

	it("forbids USER with 403", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);

		const usersRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				headers: { cookie },
			}),
		);
		expect(usersRes.status).toBe(403);
		const usersBody = (await usersRes.json()) as { error: string };
		expect(usersBody.error).toBe("forbidden");

		const groupsRes = await workerFetch(
			new Request("http://example.com/api/admin/groups", {
				headers: { cookie },
			}),
		);
		expect(groupsRes.status).toBe(403);

		const createUserRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({
					email: "x@example.com",
					password: "Password1!",
					displayName: "x",
				}),
			}),
		);
		expect(createUserRes.status).toBe(403);
	});

	it("lets ADMIN create a group that is listed for admin but not in membership GET /api/groups", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createRes = await workerFetch(
			new Request("http://example.com/api/admin/groups", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ name: "  管理用グループ  " }),
			}),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			group: { id: string; name: string };
		};
		expect(created.group.name).toBe("管理用グループ");

		const adminListRes = await workerFetch(
			new Request("http://example.com/api/admin/groups", {
				headers: { cookie },
			}),
		);
		expect(adminListRes.status).toBe(200);
		const adminList = (await adminListRes.json()) as {
			groups: Array<{ id: string; members: unknown[] }>;
		};
		expect(adminList.groups.some((group) => group.id === created.group.id)).toBe(
			true,
		);
		expect(
			adminList.groups.some((group) => group.id === SEED.groupOther),
		).toBe(true);

		const membershipRes = await workerFetch(
			new Request("http://example.com/api/groups", {
				headers: { cookie },
			}),
		);
		expect(membershipRes.status).toBe(200);
		const membership = (await membershipRes.json()) as {
			groups: Array<{ id: string }>;
		};
		expect(
			membership.groups.some((group) => group.id === created.group.id),
		).toBe(false);
		expect(
			membership.groups.some((group) => group.id === SEED.groupMember),
		).toBe(true);
	});

	it("lets ADMIN create a USER who can log in, and rejects duplicate email", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({
					email: "new-user@example.com",
					password: "NewPass123!",
					displayName: "新規",
				}),
			}),
		);
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as {
			user: { id: string; email: string; role: string; displayName: string };
		};
		expect(created.user.email).toBe("new-user@example.com");
		expect(created.user.role).toBe("USER");
		expect(created.user.displayName).toBe("新規");

		const listRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				headers: { cookie },
			}),
		);
		const list = (await listRes.json()) as {
			users: Array<{ email: string }>;
		};
		expect(list.users.some((user) => user.email === created.user.email)).toBe(
			true,
		);

		const { response: loginRes } = await loginAs(
			workerFetch,
			"new-user@example.com",
			"NewPass123!",
		);
		expect(loginRes.status).toBe(200);

		const duplicateRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({
					email: "new-user@example.com",
					password: "Another1!",
					displayName: "別ユーザー",
				}),
			}),
		);
		expect(duplicateRes.status).toBe(409);
		const duplicateBody = (await duplicateRes.json()) as { error: string };
		expect(duplicateBody.error).toBe("email_taken");
	});

	it("lets ADMIN add and remove group members", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const createGroupRes = await workerFetch(
			new Request("http://example.com/api/admin/groups", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ name: "所属テスト" }),
			}),
		);
		const { group } = (await createGroupRes.json()) as { group: { id: string } };

		const addRes = await workerFetch(
			new Request(`http://example.com/api/admin/groups/${group.id}/members`, {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ userId: SEED.testUser.id }),
			}),
		);
		expect(addRes.status).toBe(201);
		const added = (await addRes.json()) as {
			member: { id: string; email: string };
		};
		expect(added.member.id).toBe(SEED.testUser.id);

		const alreadyRes = await workerFetch(
			new Request(`http://example.com/api/admin/groups/${group.id}/members`, {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ userId: SEED.testUser.id }),
			}),
		);
		expect(alreadyRes.status).toBe(409);
		const alreadyBody = (await alreadyRes.json()) as { error: string };
		expect(alreadyBody.error).toBe("already_member");

		const { cookie: userCookie } = await loginAs(
			workerFetch,
			SEED.testUser.email,
			SEED.testUser.password,
		);
		const userGroupsRes = await workerFetch(
			new Request("http://example.com/api/groups", {
				headers: { cookie: userCookie },
			}),
		);
		const userGroups = (await userGroupsRes.json()) as {
			groups: Array<{ id: string }>;
		};
		expect(userGroups.groups.some((item) => item.id === group.id)).toBe(true);

		const removeRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/groups/${group.id}/members/${SEED.testUser.id}`,
				{
					method: "DELETE",
					headers: { cookie },
				},
			),
		);
		expect(removeRes.status).toBe(200);

		const notMemberRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/groups/${group.id}/members/${SEED.testUser.id}`,
				{
					method: "DELETE",
					headers: { cookie },
				},
			),
		);
		expect(notMemberRes.status).toBe(404);
		const notMemberBody = (await notMemberRes.json()) as { error: string };
		expect(notMemberBody.error).toBe("not_member");
	});

	it("returns 404 when group or user does not exist", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);
		const missingId = "00000000-0000-4000-a000-999999999999";

		const missingGroupRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/groups/${missingId}/members`,
				{
					method: "POST",
					headers: { cookie, "content-type": "application/json" },
					body: JSON.stringify({ userId: SEED.testUser.id }),
				},
			),
		);
		expect(missingGroupRes.status).toBe(404);

		const missingUserRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/groups/${SEED.groupMember}/members`,
				{
					method: "POST",
					headers: { cookie, "content-type": "application/json" },
					body: JSON.stringify({ userId: missingId }),
				},
			),
		);
		expect(missingUserRes.status).toBe(404);

		const missingDeleteRes = await workerFetch(
			new Request(
				`http://example.com/api/admin/groups/${missingId}/members/${SEED.testUser.id}`,
				{
					method: "DELETE",
					headers: { cookie },
				},
			),
		);
		expect(missingDeleteRes.status).toBe(404);
	});

	it("rejects invalid create payloads with 400", async () => {
		const { cookie } = await loginAs(
			workerFetch,
			SEED.admin.email,
			SEED.admin.password,
		);

		const userRes = await workerFetch(
			new Request("http://example.com/api/admin/users", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({
					email: "not-an-email",
					password: "short",
					displayName: "",
				}),
			}),
		);
		expect(userRes.status).toBe(400);
		const userBody = (await userRes.json()) as { error: string };
		expect(userBody.error).toBe("invalid_request");

		const groupRes = await workerFetch(
			new Request("http://example.com/api/admin/groups", {
				method: "POST",
				headers: { cookie, "content-type": "application/json" },
				body: JSON.stringify({ name: "" }),
			}),
		);
		expect(groupRes.status).toBe(400);
	});
});
