import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "../../src/react-app/lib/push";

describe("urlBase64ToUint8Array", () => {
	it("decodes base64url without padding", () => {
		// "hello" in base64url
		const bytes = urlBase64ToUint8Array("aGVsbG8");
		expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
	});

	it("handles url-safe alphabet", () => {
		const bytes = urlBase64ToUint8Array("-_8");
		expect(bytes.length).toBeGreaterThan(0);
	});
});
