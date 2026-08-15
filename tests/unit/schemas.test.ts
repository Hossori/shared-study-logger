import { describe, expect, it } from "vitest";
import {
	ChangePasswordRequestSchema,
	CreateAdminGroupRequestSchema,
	CreateAdminUserRequestSchema,
	AddGroupMemberRequestSchema,
	CreateInAppNotificationRequestSchema,
	CreateStudyRecordRequestSchema,
	LoginRequestSchema,
	UpdateInAppNotificationRequestSchema,
	UpdateProfileRequestSchema,
	UserRoleSchema,
	UserSchema,
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

describe("UserRoleSchema", () => {
	it("accepts ADMIN and USER", () => {
		expect(UserRoleSchema.safeParse("ADMIN").success).toBe(true);
		expect(UserRoleSchema.safeParse("USER").success).toBe(true);
	});

	it("rejects unknown roles", () => {
		expect(UserRoleSchema.safeParse("admin").success).toBe(false);
		expect(UserRoleSchema.safeParse("SUPERUSER").success).toBe(false);
	});
});

describe("UserSchema", () => {
	const validUser = {
		id: "00000000-0000-4000-a000-000000000001",
		email: "admin@example.com",
		displayName: "管理者",
		role: "ADMIN",
		bio: null,
		avatarKey: null,
		createdAt: "2026-08-01T00:00:00.000Z",
	};

	it("accepts a user with role", () => {
		expect(UserSchema.safeParse(validUser).success).toBe(true);
	});

	it("rejects missing role", () => {
		expect(
			UserSchema.safeParse({
				id: validUser.id,
				email: validUser.email,
				displayName: validUser.displayName,
				bio: validUser.bio,
				avatarKey: validUser.avatarKey,
				createdAt: validUser.createdAt,
			}).success,
		).toBe(false);
	});

	it("rejects invalid role", () => {
		expect(
			UserSchema.safeParse({ ...validUser, role: "GOD" }).success,
		).toBe(false);
	});
});

describe("CreateInAppNotificationRequestSchema", () => {
	it("accepts trimmed title and body", () => {
		const result = CreateInAppNotificationRequestSchema.safeParse({
			title: "  お知らせ  ",
			body: " 本文 ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.title).toBe("お知らせ");
			expect(result.data.body).toBe("本文");
		}
	});

	it("rejects empty title or body", () => {
		expect(
			CreateInAppNotificationRequestSchema.safeParse({
				title: "   ",
				body: "本文",
			}).success,
		).toBe(false);
		expect(
			CreateInAppNotificationRequestSchema.safeParse({
				title: "お知らせ",
				body: "",
			}).success,
		).toBe(false);
	});
});

describe("UpdateInAppNotificationRequestSchema", () => {
	it("accepts enabled boolean", () => {
		expect(
			UpdateInAppNotificationRequestSchema.safeParse({ enabled: false })
				.success,
		).toBe(true);
	});

	it("rejects missing enabled", () => {
		expect(UpdateInAppNotificationRequestSchema.safeParse({}).success).toBe(
			false,
		);
	});
});

describe("CreateAdminUserRequestSchema", () => {
	const valid = {
		email: "new@example.com",
		password: "Password1!",
		displayName: "新規ユーザー",
	};

	it("accepts a valid payload and trims displayName", () => {
		const result = CreateAdminUserRequestSchema.safeParse({
			...valid,
			displayName: "  新規ユーザー  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.displayName).toBe("新規ユーザー");
		}
	});

	it("rejects invalid email", () => {
		expect(
			CreateAdminUserRequestSchema.safeParse({
				...valid,
				email: "not-an-email",
			}).success,
		).toBe(false);
	});

	it("rejects short password", () => {
		expect(
			CreateAdminUserRequestSchema.safeParse({
				...valid,
				password: "short",
			}).success,
		).toBe(false);
	});

	it("rejects empty displayName", () => {
		expect(
			CreateAdminUserRequestSchema.safeParse({
				...valid,
				displayName: "   ",
			}).success,
		).toBe(false);
	});
});

describe("CreateAdminGroupRequestSchema", () => {
	it("accepts a trimmed name", () => {
		const result = CreateAdminGroupRequestSchema.safeParse({
			name: "  新グループ  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("新グループ");
		}
	});

	it("rejects empty name", () => {
		expect(
			CreateAdminGroupRequestSchema.safeParse({ name: "   " }).success,
		).toBe(false);
	});
});

describe("AddGroupMemberRequestSchema", () => {
	it("accepts a userId", () => {
		expect(
			AddGroupMemberRequestSchema.safeParse({
				userId: "00000000-0000-4000-a000-000000000005",
			}).success,
		).toBe(true);
	});

	it("rejects empty userId", () => {
		expect(AddGroupMemberRequestSchema.safeParse({ userId: "" }).success).toBe(
			false,
		);
	});
});
