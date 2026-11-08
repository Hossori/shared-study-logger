import { describe, expect, it } from "vitest";
import { isAdmin } from "@shared/schemas";
import { toUser, type UserRow } from "../../src/worker/lib/db";

function userRow(overrides: Partial<UserRow> = {}): UserRow {
	return {
		id: "00000000-0000-4000-a000-000000000001",
		email: "admin@example.com",
		password_hash: "hash",
		password_salt: "salt",
		display_name: "管理者",
		role: "USER",
		bio: null,
		avatar_key: null,
		created_at: "2026-08-01T00:00:00.000Z",
		...overrides,
	};
}

describe("isAdmin", () => {
	it("is true only for ADMIN", () => {
		expect(isAdmin({ role: "ADMIN" })).toBe(true);
		expect(isAdmin({ role: "USER" })).toBe(false);
	});
});

describe("toUser role mapping", () => {
	it("maps ADMIN and USER from the row", () => {
		expect(toUser(userRow({ role: "ADMIN" })).role).toBe("ADMIN");
		expect(toUser(userRow({ role: "USER" })).role).toBe("USER");
	});

	it("passes the DB role through without coercing it", () => {
		expect(toUser(userRow({ role: null })).role).toBeNull();
		expect(toUser(userRow({ role: "" })).role).toBe("");
		expect(toUser(userRow({ role: "admin" })).role).toBe("admin");
		expect(toUser(userRow({ role: "SUPERUSER" })).role).toBe("SUPERUSER");
		expect(toUser(userRow({ role: "nope" })).role).toBe("nope");
	});
});
