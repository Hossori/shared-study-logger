import { describe, expect, it } from "vitest";
import {
	changePasswordFieldErrors,
	ChangePasswordFormSchema,
} from "../../src/react-app/features/auth/changePasswordForm";

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
		expect(changePasswordFieldErrors(parsed.error)).toEqual({
			confirmPassword: "新しいパスワード（確認）が一致しません。",
		});
	});

	it("rejects a short new password on the request field", () => {
		const parsed = ChangePasswordFormSchema.safeParse({
			currentPassword: "ChangeMe123!",
			newPassword: "short",
			confirmPassword: "short",
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(changePasswordFieldErrors(parsed.error)).toEqual({
			newPassword: "新しいパスワードは8文字以上で入力してください。",
		});
	});

	it("uses the schema message for an empty current password", () => {
		const parsed = ChangePasswordFormSchema.safeParse({
			currentPassword: "",
			newPassword: "NewPassword1!",
			confirmPassword: "NewPassword1!",
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(changePasswordFieldErrors(parsed.error).currentPassword).toBe(
			"現在のパスワードを入力してください。",
		);
	});
});
