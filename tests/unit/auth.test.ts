import { describe, expect, it } from "vitest";
import {
	generateSaltHex,
	hashPassword,
	verifyPassword,
} from "../../src/worker/lib/auth";

describe("auth password helpers", () => {
	it("generateSaltHex returns 32 hex chars", () => {
		const salt = generateSaltHex();
		expect(salt).toMatch(/^[0-9a-f]{32}$/);
	});

	it("hashPassword is deterministic for same salt", async () => {
		const salt = "aabbccddeeff00112233445566778899";
		const a = await hashPassword("ChangeMe123!", salt);
		const b = await hashPassword("ChangeMe123!", salt);
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});

	it("verifyPassword accepts correct and rejects wrong password", async () => {
		const salt = generateSaltHex();
		const hash = await hashPassword("ChangeMe123!", salt);
		expect(await verifyPassword("ChangeMe123!", salt, hash)).toBe(true);
		expect(await verifyPassword("wrong", salt, hash)).toBe(false);
	});
});
