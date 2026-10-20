import { describe, expect, it } from "vitest";
import { findStemCasingCollisions } from "../../scripts/check-path-casing.mjs";

describe("findStemCasingCollisions", () => {
	it("flags LoginForm.tsx beside loginForm.ts", () => {
		expect(
			findStemCasingCollisions([
				"src/react-app/features/auth/LoginForm.tsx",
				"src/react-app/features/auth/loginForm.ts",
			]),
		).toEqual([
			[
				"src/react-app/features/auth/LoginForm.tsx",
				"src/react-app/features/auth/loginForm.ts",
			],
		]);
	});

	it("allows a schema suffix that changes the stem", () => {
		expect(
			findStemCasingCollisions([
				"src/react-app/features/auth/LoginForm.tsx",
				"src/react-app/features/auth/loginFormSchema.ts",
			]),
		).toEqual([]);
	});

	it("allows index.ts and index.tsx because the stem spelling matches", () => {
		expect(
			findStemCasingCollisions(["src/pages/index.ts", "src/pages/index.tsx"]),
		).toEqual([]);
	});

	it("allows the same stem spelling in directories that differ only by case", () => {
		expect(
			findStemCasingCollisions(["src/Foo/a.ts", "src/foo/a.ts"]),
		).toEqual([]);
	});
});
