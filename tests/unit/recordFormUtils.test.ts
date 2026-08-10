import { describe, expect, it } from "vitest";
import {
	buildRecordRequestPayload,
	parseDatetimeLocalToIso,
	toDatetimeLocalString,
} from "../../src/react-app/features/records/recordFormUtils";

describe("recordFormUtils", () => {
	it("parseDatetimeLocalToIso returns ISO or null", () => {
		const iso = parseDatetimeLocalToIso("2026-08-01T12:00");
		expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(parseDatetimeLocalToIso("")).toBeNull();
		expect(parseDatetimeLocalToIso("not-a-date")).toBeNull();
	});

	it("toDatetimeLocalString formats valid ISO", () => {
		const local = toDatetimeLocalString("2026-08-01T12:00:00.000Z");
		expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		expect(toDatetimeLocalString("bad")).toBe("");
	});

	it("buildRecordRequestPayload trims and drops empty memo", () => {
		const payload = buildRecordRequestPayload({
			studyDatetime: "2026-08-01T12:00",
			title: "  数学  ",
			memo: "   ",
		});
		expect(payload).not.toBeNull();
		expect(payload?.title).toBe("数学");
		expect(payload?.memo).toBeUndefined();
		expect(
			buildRecordRequestPayload({
				studyDatetime: "",
				title: "x",
				memo: "",
			}),
		).toBeNull();
	});
});
