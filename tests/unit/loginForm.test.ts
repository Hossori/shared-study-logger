import { describe, expect, it } from "vitest";
import { LoginFormSchema } from "../../src/react-app/features/auth/loginForm";

describe("LoginFormSchema", () => {
	it("trims email before validating and sending", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "  user@example.com  ",
			password: "secret",
		});
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(parsed.data.email).toBe("user@example.com");
		expect(parsed.data.password).toBe("secret");
	});

	it("rejects an empty password", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(parsed.success).toBe(false);
	});

	it("rejects an invalid email after trim", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "  not-an-email  ",
			password: "secret",
		});
		expect(parsed.success).toBe(false);
	});
});
