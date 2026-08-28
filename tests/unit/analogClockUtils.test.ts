import { describe, expect, it } from "vitest";
import {
	clockLabelToHour,
	hourHandAngleDegrees,
	hourHandLength,
	hourLabelFromPointer,
	hourToClockLabel,
	INNER_HAND_LENGTH,
	OUTER_HAND_LENGTH,
	minuteHandAngleDegrees,
} from "../../src/react-app/features/records/analogClockUtils";

describe("analogClockUtils", () => {
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
});
