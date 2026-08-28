import { describe, expect, it } from "vitest";
import {
	buildRecordRequestPayload,
	formatDurationMinutes,
	formatRecordDatetime,
	isRecordDateString,
	parseDatetimeLocalToIso,
	parseRecordDatetime,
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

	it("parseRecordDatetime and formatRecordDatetime round-trip", () => {
		expect(parseRecordDatetime("2026-08-10T09:05")).toEqual({
			date: "2026-08-10",
			hour: 9,
			minute: 5,
		});
		expect(formatRecordDatetime("2026-08-10", 9, 5)).toBe("2026-08-10T09:05");
		expect(parseRecordDatetime("")).toBeNull();
		expect(parseRecordDatetime("2026-08-10T24:00")).toBeNull();
		expect(parseRecordDatetime("T15:58")).toBeNull();
		expect(isRecordDateString("2026-08-10")).toBe(true);
		expect(isRecordDateString("")).toBe(false);
		expect(isRecordDateString("08/28/2026")).toBe(false);
	});

	it("formatDurationMinutes uses hours and minutes", () => {
		expect(formatDurationMinutes(10)).toBe("10分");
		expect(formatDurationMinutes(60)).toBe("1時間");
		expect(formatDurationMinutes(90)).toBe("1時間30分");
	});

	it("buildRecordRequestPayload trims and includes optional duration", () => {
		const payload = buildRecordRequestPayload({
			studyDatetime: "2026-08-01T12:00",
			title: "  数学  ",
			memo: "   ",
			durationMinutes: 30,
		});
		expect(payload).not.toBeNull();
		expect(payload?.title).toBe("数学");
		expect(payload?.memo).toBeUndefined();
		expect(payload?.durationMinutes).toBe(30);
		expect(
			buildRecordRequestPayload({
				studyDatetime: "",
				title: "x",
				memo: "",
				durationMinutes: null,
			}),
		).toBeNull();
		expect(
			buildRecordRequestPayload({
				studyDatetime: "T15:58",
				title: "x",
				memo: "",
				durationMinutes: null,
			}),
		).toBeNull();
		expect(
			buildRecordRequestPayload({
				studyDatetime: "2026-08-01T12:00",
				title: "x",
				memo: "",
				durationMinutes: null,
			})?.durationMinutes,
		).toBeNull();
	});
});
