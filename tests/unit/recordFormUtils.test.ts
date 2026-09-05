import { describe, expect, it } from "vitest";
import {
	applyDurationMinutesDelta,
	buildRecordRequestPayload,
	formatDurationMinutes,
	formatRecordDatetime,
	isRecordDateString,
	localDateToRecordDateString,
	parseDatetimeLocalToIso,
	parseRecordDatetime,
	recordDateStringToLocalDate,
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

	it("toDatetimeLocalString snaps minutes to 5-minute steps", () => {
		expect(toDatetimeLocalString(new Date(2026, 7, 1, 9, 2, 0).toISOString())).toBe(
			"2026-08-01T09:00",
		);
		expect(
			toDatetimeLocalString(new Date(2026, 7, 1, 9, 58, 0).toISOString()),
		).toBe("2026-08-01T10:00");
	});

	it("recordDateStringToLocalDate and localDateToRecordDateString round-trip", () => {
		const local = recordDateStringToLocalDate("2026-08-10");
		expect(local.getFullYear()).toBe(2026);
		expect(local.getMonth()).toBe(7);
		expect(local.getDate()).toBe(10);
		expect(localDateToRecordDateString(local)).toBe("2026-08-10");
		expect(recordDateStringToLocalDate("2026-08-10").getDate()).toBe(10);
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
		expect(formatDurationMinutes(5)).toBe("5分");
		expect(formatDurationMinutes(10)).toBe("10分");
		expect(formatDurationMinutes(60)).toBe("1時間");
		expect(formatDurationMinutes(90)).toBe("1時間30分");
	});

	it("applyDurationMinutesDelta clamps and treats zero as unset", () => {
		expect(applyDurationMinutesDelta(null, 5)).toBe(5);
		expect(applyDurationMinutesDelta(5, -5)).toBeNull();
		expect(applyDurationMinutesDelta(5, -10)).toBeNull();
		expect(applyDurationMinutesDelta(715, 10)).toBe(720);
		expect(applyDurationMinutesDelta(720, 5)).toBe(720);
		expect(applyDurationMinutesDelta(null, -5)).toBeNull();
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
		expect(
			buildRecordRequestPayload({
				studyDatetime: "2026-08-01T12:00",
				title: "x",
				memo: "",
				durationMinutes: 0,
			})?.durationMinutes,
		).toBeNull();
	});
});
