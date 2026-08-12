import { describe, expect, it } from "vitest";
import { getAvatarUrl } from "../../shared/avatars";

describe("getAvatarUrl", () => {
	it("returns numbered preset path for known key", () => {
		expect(getAvatarUrl("avoidy")).toBe("/avatars/1_avoidy.png");
		expect(getAvatarUrl("lavender")).toBe("/avatars/2_lavender.png");
		expect(getAvatarUrl("stolen")).toBe("/avatars/6_stolen.png");
	});

	it("returns null for null/undefined/unknown/legacy key", () => {
		expect(getAvatarUrl(null)).toBeNull();
		expect(getAvatarUrl(undefined)).toBeNull();
		expect(getAvatarUrl("dragon")).toBeNull();
		expect(getAvatarUrl("fox")).toBeNull();
	});
});
