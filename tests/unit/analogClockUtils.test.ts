import { describe, expect, it } from "vitest";
import {
	applyClockMinuteSnap,
	clockLabelToHour,
	hourHandAngleDegrees,
	hourHandLength,
	hourLabelFromPointer,
	hourToClockLabel,
	INNER_HAND_LENGTH,
	OUTER_CLOCK_HOURS,
	OUTER_HAND_LENGTH,
	minuteFromPointer,
	minuteHandAngleDegrees,
	snapToClockMinute,
} from "../../src/react-app/features/records/analogClockUtils";

describe("analogClockUtils", () => {
	it("lists outer ring hours as 13-24 without 0", () => {
		expect(OUTER_CLOCK_HOURS).toContain(24);
		expect(OUTER_CLOCK_HOURS).not.toContain(0);
	});

	it("maps 24 to hour 0 and back", () => {
		expect(clockLabelToHour(24)).toBe(0);
		expect(hourToClockLabel(0)).toBe(24);
		expect(clockLabelToHour(13)).toBe(13);
		expect(hourToClockLabel(12)).toBe(12);
	});

	it("uses a longer hour hand for the outer 13-24 ring", () => {
		expect(hourHandLength(12)).toBe(INNER_HAND_LENGTH);
		expect(hourHandLength(24)).toBe(OUTER_HAND_LENGTH);
		expect(hourHandLength(13)).toBe(OUTER_HAND_LENGTH);
	});

	it("places 12 and 24 at the top and 3/15 at 90 degrees", () => {
		expect(hourHandAngleDegrees(12, 0)).toBe(0);
		expect(hourHandAngleDegrees(0, 0)).toBe(0);
		expect(hourHandAngleDegrees(3, 0)).toBe(90);
		expect(hourHandAngleDegrees(15, 0)).toBe(90);
		expect(minuteHandAngleDegrees(15)).toBe(90);
		expect(hourHandAngleDegrees(12, 30)).toBe(15);
	});

	it("picks inner or outer hour from pointer radius and angle", () => {
		const cx = 140;
		const cy = 140;
		// 12 o'clock, inner ring
		expect(hourLabelFromPointer(cx, cy - 74, cx, cy)).toBe(12);
		// 12 o'clock, outer ring → 24
		expect(hourLabelFromPointer(cx, cy - 118, cx, cy)).toBe(24);
		// 3 o'clock inner → 3, outer → 15
		expect(hourLabelFromPointer(cx + 74, cy, cx, cy)).toBe(3);
		expect(hourLabelFromPointer(cx + 118, cy, cx, cy)).toBe(15);
		expect(hourLabelFromPointer(cx, cy, cx, cy)).toBeNull();
	});

	it("snaps minutes to 5-minute steps", () => {
		expect(snapToClockMinute(0)).toBe(0);
		expect(snapToClockMinute(2)).toBe(0);
		expect(snapToClockMinute(3)).toBe(5);
		expect(snapToClockMinute(55)).toBe(55);
		expect(snapToClockMinute(58)).toBe(0);
	});

	it("rolls 58-59 minutes to the next hour on a Date", () => {
		const snapped = applyClockMinuteSnap(new Date(2026, 7, 1, 9, 58, 40));
		expect(snapped.getHours()).toBe(10);
		expect(snapped.getMinutes()).toBe(0);
		expect(snapped.getSeconds()).toBe(0);
		const midnight = applyClockMinuteSnap(new Date(2026, 7, 1, 23, 58, 0));
		expect(midnight.getDate()).toBe(2);
		expect(midnight.getHours()).toBe(0);
		expect(midnight.getMinutes()).toBe(0);
	});

	it("picks 5-minute values from pointer angle", () => {
		const cx = 140;
		const cy = 140;
		expect(minuteFromPointer(cx, cy - 110, cx, cy)).toBe(0);
		expect(minuteFromPointer(cx + 110, cy, cx, cy)).toBe(15);
		expect(minuteFromPointer(cx, cy + 110, cx, cy)).toBe(30);
		expect(minuteFromPointer(cx - 110, cy, cx, cy)).toBe(45);
		expect(minuteFromPointer(cx, cy, cx, cy)).toBeNull();
	});
});
