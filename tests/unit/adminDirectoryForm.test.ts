import { describe, expect, it } from "vitest";
import { CreateAdminGroupFormSchema } from "../../src/react-app/features/groups/adminDirectoryForm";

describe("CreateAdminGroupFormSchema", () => {
	it("rejects a whitespace-only group name", () => {
		const parsed = CreateAdminGroupFormSchema.safeParse({ name: "   " });
		expect(parsed.success).toBe(false);
	});

	it("trims a valid group name", () => {
		const parsed = CreateAdminGroupFormSchema.safeParse({ name: "  Team A  " });
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;
		expect(parsed.data.name).toBe("Team A");
	});
});
