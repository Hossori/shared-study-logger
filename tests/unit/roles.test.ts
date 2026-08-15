import { describe, expect, it } from "vitest";
import { isAdmin, parseUserRole } from "../../shared/schemas";
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

describe("parseUserRole", () => {
	it("returns ADMIN and USER as-is", () => {
		expect(parseUserRole("ADMIN")).toBe("ADMIN");
		expect(parseUserRole("USER")).toBe("USER");
	});

	it("defaults missing or unknown values to USER", () => {
		expect(parseUserRole(null)).toBe("USER");
		expect(parseUserRole(undefined)).toBe("USER");
		expect(parseUserRole("")).toBe("USER");
		expect(parseUserRole("admin")).toBe("USER");
		expect(parseUserRole("SUPERUSER")).toBe("USER");
	});
});

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

	it("defaults null or unknown DB role to USER", () => {
		expect(toUser(userRow({ role: null })).role).toBe("USER");
		expect(toUser(userRow({ role: "nope" })).role).toBe("USER");
	});
});
