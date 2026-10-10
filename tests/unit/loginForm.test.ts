import { describe, expect, it } from "vitest";
import { LoginFormSchema } from "../../src/react-app/features/auth/loginForm";

describe("LoginFormSchema", () => {
	it("rejects an email with surrounding whitespace", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "  user@example.com  ",
			password: "secret",
		});
		expect(parsed.success).toBe(false);
	});

	it("rejects an empty password", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(parsed.success).toBe(false);
	});

	it("rejects an invalid email", () => {
		const parsed = LoginFormSchema.safeParse({
			email: "  not-an-email  ",
			password: "secret",
		});
		expect(parsed.success).toBe(false);
	});
});
