import { describe, expect, it } from "vitest";
import { parseStudyRecordsCursor } from "../../src/worker/lib/db";

function encodeCursor(
	studyDatetime: string,
	updatedAt: string,
	id: string,
): string {
	const bytes = new TextEncoder().encode(
		`${studyDatetime}|${updatedAt}|${id}`,
	);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

describe("parseStudyRecordsCursor", () => {
	it("parses a valid cursor", () => {
		const cursor = encodeCursor(
			"2026-08-01T12:00:00.000Z",
			"2026-08-01T13:00:00.000Z",
			"record-1",
		);
		expect(parseStudyRecordsCursor(cursor)).toEqual({
			studyDatetime: "2026-08-01T12:00:00.000Z",
			updatedAt: "2026-08-01T13:00:00.000Z",
			id: "record-1",
		});
	});

	it("returns null for invalid base64 or shape", () => {
		expect(parseStudyRecordsCursor("!!!")).toBeNull();
		expect(parseStudyRecordsCursor(btoa("only-one-part"))).toBeNull();
		expect(parseStudyRecordsCursor(btoa("a|b|"))).toBeNull();
	});
});
