import { describe, expect, it } from "vitest";
import {
	ChangePasswordRequestSchema,
	CreateStudyRecordRequestSchema,
	LoginRequestSchema,
	UpdateProfileRequestSchema,
} from "../../shared/schemas";

describe("LoginRequestSchema", () => {
	it("accepts valid email and password", () => {
		const result = LoginRequestSchema.safeParse({
			email: "admin@example.com",
			password: "ChangeMe123!",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = LoginRequestSchema.safeParse({
			email: "not-an-email",
			password: "x",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty password", () => {
		const result = LoginRequestSchema.safeParse({
			email: "a@b.co",
			password: "",
		});
		expect(result.success).toBe(false);
	});
});

describe("UpdateProfileRequestSchema", () => {
	it("requires at least one field", () => {
		expect(UpdateProfileRequestSchema.safeParse({}).success).toBe(false);
	});

	it("accepts displayName only", () => {
		const result = UpdateProfileRequestSchema.safeParse({
			displayName: "管理者",
		});
		expect(result.success).toBe(true);
	});
});

describe("ChangePasswordRequestSchema", () => {
	it("rejects short newPassword", () => {
		const result = ChangePasswordRequestSchema.safeParse({
			currentPassword: "old",
			newPassword: "short",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid passwords", () => {
		const result = ChangePasswordRequestSchema.safeParse({
			currentPassword: "ChangeMe123!",
			newPassword: "NewPassword1!",
		});
		expect(result.success).toBe(true);
	});
});

describe("CreateStudyRecordRequestSchema", () => {
	it("accepts ISO datetime and title", () => {
		const result = CreateStudyRecordRequestSchema.safeParse({
			studyDatetime: "2026-08-01T12:00:00.000Z",
			title: "数学",
			memo: "演習",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty title", () => {
		const result = CreateStudyRecordRequestSchema.safeParse({
			studyDatetime: "2026-08-01T12:00:00.000Z",
			title: "",
		});
		expect(result.success).toBe(false);
	});
});
