import { describe, expect, it } from "vitest";
import { EditProfileFormSchema } from "../../src/react-app/features/auth/editProfileForm";

describe("EditProfileFormSchema", () => {
	it("maps a whitespace-only bio to null", () => {
		const parsed = EditProfileFormSchema.safeParse({
			displayName: "Alice",
			bio: "   ",
			avatarKey: null,
		});
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(parsed.data.bio).toBeNull();
	});

	it("trims displayName before sending", () => {
		const parsed = EditProfileFormSchema.safeParse({
			displayName: "  Alice  ",
			bio: "hello",
			avatarKey: null,
		});
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(parsed.data.displayName).toBe("Alice");
		expect(parsed.data.bio).toBe("hello");
	});

	it("uses the schema message for an empty display name", () => {
		const parsed = EditProfileFormSchema.safeParse({
			displayName: "   ",
			bio: "",
			avatarKey: null,
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.error.issues.some((issue) => issue.path[0] === "displayName")).toBe(
			true,
		);
	});
});
