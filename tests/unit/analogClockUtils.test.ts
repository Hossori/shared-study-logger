import { describe, expect, it } from "vitest";
import {
	ANALOG_CLOCK_CENTER,
	applyClockMinuteSnap,
	CLOCK_MINUTE_RADIUS,
	hourHandAngleDegrees,
	hourHandLength,
	hourLabelFromPointer,
	INNER_HAND_LENGTH,
	INNER_NUMBER_RADIUS,
	OUTER_CLOCK_HOURS,
	OUTER_HAND_LENGTH,
	OUTER_NUMBER_RADIUS,
	minuteFromPointer,
	minuteHandAngleDegrees,
	snapToClockMinute,
} from "../../src/react-app/features/records/form/analogClockUtils";

const clockCx = ANALOG_CLOCK_CENTER;
const clockCy = ANALOG_CLOCK_CENTER;

function pointAt(dist: number, angleDegrees: number) {
	const radians = ((angleDegrees - 90) * Math.PI) / 180;
	return {
		x: clockCx + dist * Math.cos(radians),
		y: clockCy + dist * Math.sin(radians),
	};
}

describe("analogClockUtils", () => {
	it("lists outer ring hours as 13-0 without 24", () => {
		expect(OUTER_CLOCK_HOURS).toContain(0);
		expect(OUTER_CLOCK_HOURS).not.toContain(24);
	});

	it("uses a longer hour hand for the outer 13-0 ring", () => {
		expect(hourHandLength(12)).toBe(INNER_HAND_LENGTH);
		expect(hourHandLength(0)).toBe(OUTER_HAND_LENGTH);
		expect(hourHandLength(13)).toBe(OUTER_HAND_LENGTH);
	});

	it("places 12 and 0 at the top and 3/15 at 90 degrees", () => {
		expect(hourHandAngleDegrees(12)).toBe(0);
		expect(hourHandAngleDegrees(0)).toBe(0);
		expect(hourHandAngleDegrees(3)).toBe(90);
		expect(hourHandAngleDegrees(15)).toBe(90);
		expect(minuteHandAngleDegrees(15)).toBe(90);
	});

	it("picks inner or outer hour from pointer radius and angle", () => {
		const cx = 140;
		const cy = 140;
		// 12 o'clock, inner ring
		expect(hourLabelFromPointer(cx, cy - 74, cx, cy)).toBe(12);
		// 12 o'clock, outer ring → 0
		expect(hourLabelFromPointer(cx, cy - 118, cx, cy)).toBe(0);
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

	it("hourLabelFromPointer respects inner and outer distance bounds", () => {
		const innerMin = INNER_NUMBER_RADIUS * 0.4;
		const outerMax = OUTER_NUMBER_RADIUS + 24;
		const inside = pointAt(innerMin + 0.1, 0);
		const outside = pointAt(innerMin - 0.1, 0);
		expect(hourLabelFromPointer(inside.x, inside.y, clockCx, clockCy)).toBe(
			12,
		);
		expect(
			hourLabelFromPointer(outside.x, outside.y, clockCx, clockCy),
		).toBeNull();

		const inOuter = pointAt(outerMax - 0.1, 0);
		const outOuter = pointAt(outerMax + 0.1, 0);
		expect(hourLabelFromPointer(inOuter.x, inOuter.y, clockCx, clockCy)).toBe(
			0,
		);
		expect(
			hourLabelFromPointer(outOuter.x, outOuter.y, clockCx, clockCy),
		).toBeNull();
	});

	it("hourLabelFromPointer switches inner and outer rings at the midpoint", () => {
		const midpoint = (INNER_NUMBER_RADIUS + OUTER_NUMBER_RADIUS) / 2;
		const innerSide = pointAt(midpoint - 0.1, 0);
		const outerSide = pointAt(midpoint + 0.1, 0);
		expect(
			hourLabelFromPointer(innerSide.x, innerSide.y, clockCx, clockCy),
		).toBe(12);
		expect(
			hourLabelFromPointer(outerSide.x, outerSide.y, clockCx, clockCy),
		).toBe(0);
	});

	it("hourLabelFromPointer wraps 359 degrees to 12 and 0 on outer ring", () => {
		const dist = OUTER_NUMBER_RADIUS;
		const near359 = pointAt(dist, 359);
		const at0 = pointAt(dist, 0);
		expect(hourLabelFromPointer(near359.x, near359.y, clockCx, clockCy)).toBe(
			0,
		);
		expect(hourLabelFromPointer(at0.x, at0.y, clockCx, clockCy)).toBe(0);
	});

	it("hourLabelFromPointer rounds 15 degree boundaries to adjacent hours", () => {
		const dist = INNER_NUMBER_RADIUS;
		const before15 = pointAt(dist, 14);
		const after15 = pointAt(dist, 16);
		expect(
			hourLabelFromPointer(before15.x, before15.y, clockCx, clockCy),
		).toBe(12);
		expect(
			hourLabelFromPointer(after15.x, after15.y, clockCx, clockCy),
		).toBe(1);
	});

	it("minuteFromPointer respects inner and outer distance bounds", () => {
		const innerMin = CLOCK_MINUTE_RADIUS * 0.45;
		const outerMax = CLOCK_MINUTE_RADIUS + 24;
		const inside = pointAt(innerMin + 0.1, 0);
		const outside = pointAt(innerMin - 0.1, 0);
		expect(minuteFromPointer(inside.x, inside.y, clockCx, clockCy)).toBe(0);
		expect(minuteFromPointer(outside.x, outside.y, clockCx, clockCy)).toBeNull();

		const inOuter = pointAt(outerMax - 0.1, 0);
		const outOuter = pointAt(outerMax + 0.1, 0);
		expect(minuteFromPointer(inOuter.x, inOuter.y, clockCx, clockCy)).toBe(0);
		expect(
			minuteFromPointer(outOuter.x, outOuter.y, clockCx, clockCy),
		).toBeNull();
	});

	it("minuteFromPointer wraps 359 degrees to 0 minutes", () => {
		const dist = CLOCK_MINUTE_RADIUS;
		const near359 = pointAt(dist, 359);
		expect(minuteFromPointer(near359.x, near359.y, clockCx, clockCy)).toBe(0);
	});

	it("minuteFromPointer rounds 15 degree boundaries to 5-minute steps", () => {
		const dist = CLOCK_MINUTE_RADIUS;
		const beforeSnap = pointAt(dist, 14);
		const afterSnap = pointAt(dist, 16);
		expect(minuteFromPointer(beforeSnap.x, beforeSnap.y, clockCx, clockCy)).toBe(
			0,
		);
		expect(minuteFromPointer(afterSnap.x, afterSnap.y, clockCx, clockCy)).toBe(
			5,
		);
	});

	it("applyClockMinuteSnap rolls month, year, and leap-day boundaries", () => {
		const janEnd = applyClockMinuteSnap(new Date(2026, 0, 31, 23, 58, 0));
		expect(janEnd.getFullYear()).toBe(2026);
		expect(janEnd.getMonth()).toBe(1);
		expect(janEnd.getDate()).toBe(1);
		expect(janEnd.getHours()).toBe(0);
		expect(janEnd.getMinutes()).toBe(0);

		const yearEnd = applyClockMinuteSnap(new Date(2026, 11, 31, 23, 58, 0));
		expect(yearEnd.getFullYear()).toBe(2027);
		expect(yearEnd.getMonth()).toBe(0);
		expect(yearEnd.getDate()).toBe(1);

		const leapEve = applyClockMinuteSnap(new Date(2028, 1, 28, 23, 58, 0));
		expect(leapEve.getFullYear()).toBe(2028);
		expect(leapEve.getMonth()).toBe(1);
		expect(leapEve.getDate()).toBe(29);

		const leapEnd = applyClockMinuteSnap(new Date(2028, 1, 29, 23, 58, 0));
		expect(leapEnd.getFullYear()).toBe(2028);
		expect(leapEnd.getMonth()).toBe(2);
		expect(leapEnd.getDate()).toBe(1);

		const nonLeapFeb = applyClockMinuteSnap(new Date(2027, 1, 28, 23, 58, 0));
		expect(nonLeapFeb.getFullYear()).toBe(2027);
		expect(nonLeapFeb.getMonth()).toBe(2);
		expect(nonLeapFeb.getDate()).toBe(1);
	});
});
