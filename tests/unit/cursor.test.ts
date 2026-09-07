import { describe, expect, it } from "vitest";
import { parseStudyRecordsCursor } from "../../src/worker/lib/db";

function encodeCursor(sortKey: string, id: string): string {
	const bytes = new TextEncoder().encode(`${sortKey}|${id}`);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function encodeLegacyCursor(
	startedAt: string,
	updatedAt: string,
	id: string,
): string {
	const bytes = new TextEncoder().encode(
		`${startedAt}|${updatedAt}|${id}`,
	);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

describe("parseStudyRecordsCursor", () => {
	it("parses a valid 2-part cursor", () => {
		const cursor = encodeCursor(
			"2026-08-01T12:00:00.000Z",
			"record-1",
		);
		expect(parseStudyRecordsCursor(cursor)).toEqual({
			sortKey: "2026-08-01T12:00:00.000Z",
			id: "record-1",
		});
	});

	it("returns null for invalid base64 or shape", () => {
		expect(parseStudyRecordsCursor("!!!")).toBeNull();
		expect(parseStudyRecordsCursor(btoa("only-one-part"))).toBeNull();
		expect(parseStudyRecordsCursor(btoa("a|"))).toBeNull();
	});

	it("returns null for old 3-part cursors", () => {
		const legacy = encodeLegacyCursor(
			"2026-08-01T12:00:00.000Z",
			"2026-08-01T13:00:00.000Z",
			"record-1",
		);
		expect(parseStudyRecordsCursor(legacy)).toBeNull();
	});
});
