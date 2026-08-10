import { describe, expect, it } from "vitest";
import {
	DEFAULT_AVATAR_PATH,
	getAvatarUrl,
} from "../../shared/avatars";

describe("getAvatarUrl", () => {
	it("returns preset path for known key", () => {
		expect(getAvatarUrl("fox")).toBe("/avatars/fox.svg");
	});

	it("returns default for null/undefined/unknown", () => {
		expect(getAvatarUrl(null)).toBe(DEFAULT_AVATAR_PATH);
		expect(getAvatarUrl(undefined)).toBe(DEFAULT_AVATAR_PATH);
		expect(getAvatarUrl("dragon")).toBe(DEFAULT_AVATAR_PATH);
	});
});
