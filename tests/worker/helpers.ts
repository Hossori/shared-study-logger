/**
 * Workers 統合テスト用ヘルパー（seed・Cookie）。
 * 固定アカウント方針は `.cursor/skills/testing-strategy/SKILL.md` を参照。
 */
import { env } from "cloudflare:workers";
import { hashPassword } from "../../src/worker/lib/auth";

export const SEED = {
	admin: {
		id: "00000000-0000-4000-a000-000000000001",
		email: "admin@example.com",
		password: "ChangeMe123!",
		displayName: "管理者",
		role: "ADMIN",
	},
	testUser: {
		id: "00000000-0000-4000-a000-000000000005",
		email: "test@example.com",
		password: "ChangeMe123!",
		displayName: "テストユーザー",
		role: "USER",
	},
	groupMember: "00000000-0000-4000-a000-000000000002",
	groupOther: "00000000-0000-4000-a000-000000000003",
} as const;

const FIXED_SALT = "00112233445566778899aabbccddeeff";

export async function seedMinimalDb(): Promise<void> {
	const adminHash = await hashPassword(SEED.admin.password, FIXED_SALT);
	const testHash = await hashPassword(SEED.testUser.password, FIXED_SALT);
	const now = "2026-08-01T00:00:00.000Z";

	await env.DB.batch([
		env.DB.prepare(
			`INSERT OR REPLACE INTO users (id, email, password_hash, password_salt, display_name, bio, avatar_key, role, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
		).bind(
			SEED.admin.id,
			SEED.admin.email,
			adminHash,
			FIXED_SALT,
			SEED.admin.displayName,
			SEED.admin.role,
			now,
		),
		// role 列を省略し、DEFAULT 'USER' を検証する
		env.DB.prepare(
			`INSERT OR REPLACE INTO users (id, email, password_hash, password_salt, display_name, bio, avatar_key, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)`,
		).bind(
			SEED.testUser.id,
			SEED.testUser.email,
			testHash,
			FIXED_SALT,
			SEED.testUser.displayName,
			now,
		),
		env.DB.prepare(
			`INSERT OR REPLACE INTO groups (id, name, created_at) VALUES (?, ?, ?)`,
		).bind(SEED.groupMember, "テスト所属グループ", now),
		env.DB.prepare(
			`INSERT OR REPLACE INTO groups (id, name, created_at) VALUES (?, ?, ?)`,
		).bind(SEED.groupOther, "非所属グループ", now),
		env.DB.prepare(
			`INSERT OR REPLACE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)`,
		).bind(SEED.groupMember, SEED.admin.id, now),
		env.DB.prepare(
			`INSERT OR REPLACE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)`,
		).bind(SEED.groupMember, SEED.testUser.id, now),
	]);
}

export function cookieFromResponse(response: Response): string | null {
	const raw = response.headers.get("set-cookie");
	if (!raw) return null;
	const match = /(?:^|,\s*)session=([^;]+)/i.exec(raw);
	return match ? `session=${match[1]}` : null;
}

export async function loginAs(
	fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
	email: string,
	password: string,
): Promise<{ response: Response; cookie: string }> {
	const response = await fetchImpl("http://example.com/api/auth/login", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	const cookie = cookieFromResponse(response);
	if (!cookie) {
		throw new Error(`login failed: ${response.status}`);
	}
	return { response, cookie };
}
