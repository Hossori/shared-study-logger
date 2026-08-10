import { describe, expect, it } from "vitest";
import { cn } from "../../src/react-app/lib/cn";

describe("cn", () => {
	it("joins truthy class names", () => {
		const includeB = false as boolean;
		expect(cn("a", includeB && "b", "c")).toBe("a c");
	});
});
