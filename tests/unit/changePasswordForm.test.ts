import { describe, expect, it } from "vitest";
import { ChangePasswordFormSchema } from "../../src/react-app/features/auth/changePasswordForm";

describe("ChangePasswordFormSchema", () => {
	it("drops confirmPassword after a match", () => {
		const parsed = ChangePasswordFormSchema.safeParse({
			currentPassword: "ChangeMe123!",
			newPassword: "NewPassword1!",
			confirmPassword: "NewPassword1!",
		});
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(parsed.data).toEqual({
			currentPassword: "ChangeMe123!",
			newPassword: "NewPassword1!",
		});
		expect(parsed.data).not.toHaveProperty("confirmPassword");
	});

	it("rejects a mismatched confirmation without sending it", () => {
		const parsed = ChangePasswordFormSchema.safeParse({
			currentPassword: "ChangeMe123!",
			newPassword: "NewPassword1!",
			confirmPassword: "OtherPassword1!",
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(
			true,
		);
	});

	it("rejects a short new password on the request field", () => {
		const parsed = ChangePasswordFormSchema.safeParse({
			currentPassword: "ChangeMe123!",
			newPassword: "short",
			confirmPassword: "short",
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.error.issues.some((issue) => issue.path[0] === "newPassword")).toBe(
			true,
		);
	});
});
