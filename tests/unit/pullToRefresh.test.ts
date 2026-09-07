import { describe, expect, it } from "vitest";
import {
  applyPullResistance,
  isPullGesture,
  pullIndicatorRotationDeg,
  pullIndicatorSlotHeight,
  PULL_INDICATOR_MIN_PX,
  PULL_REFRESH_HOLD_PX,
  PULL_REFRESH_MAX,
  PULL_REFRESH_THRESHOLD,
  shouldTriggerRefresh,
} from "../../src/react-app/lib/pullToRefresh";

describe("pullToRefresh", () => {
  describe("applyPullResistance", () => {
    it("returns 0 for non-positive deltaY", () => {
      expect(applyPullResistance(0)).toBe(0);
      expect(applyPullResistance(-10)).toBe(0);
    });

    it("applies resistance with ratio 0.5", () => {
      expect(applyPullResistance(40)).toBe(20);
      expect(applyPullResistance(128)).toBe(64);
    });

    it("clamps to PULL_REFRESH_MAX", () => {
      expect(applyPullResistance(200)).toBe(PULL_REFRESH_MAX);
      expect(applyPullResistance(1000)).toBe(PULL_REFRESH_MAX);
    });
  });

  describe("shouldTriggerRefresh", () => {
    it("uses PULL_REFRESH_THRESHOLD", () => {
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD - 1)).toBe(false);
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD)).toBe(true);
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD + 10)).toBe(true);
    });
  });

  describe("pullIndicatorRotationDeg", () => {
    it("scales rotation with pull distance up to threshold", () => {
      expect(pullIndicatorRotationDeg(0)).toBe(0);
      expect(pullIndicatorRotationDeg(PULL_REFRESH_THRESHOLD / 2)).toBe(180);
      expect(pullIndicatorRotationDeg(PULL_REFRESH_THRESHOLD)).toBe(360);
    });

    it("clamps at 360 when pull exceeds threshold", () => {
      expect(pullIndicatorRotationDeg(PULL_REFRESH_MAX)).toBe(360);
      expect(pullIndicatorRotationDeg(PULL_REFRESH_THRESHOLD + 20)).toBe(360);
    });
  });

  describe("pullIndicatorSlotHeight", () => {
    it("returns 0 when idle", () => {
      expect(pullIndicatorSlotHeight(0, false)).toBe(0);
    });

    it("returns hold height while refreshing", () => {
      expect(pullIndicatorSlotHeight(0, true)).toBe(PULL_REFRESH_HOLD_PX);
      expect(pullIndicatorSlotHeight(50, true)).toBe(PULL_REFRESH_HOLD_PX);
    });

    it("enforces minimum height for small pull distances", () => {
      expect(pullIndicatorSlotHeight(4, false)).toBe(PULL_INDICATOR_MIN_PX);
      expect(pullIndicatorSlotHeight(PULL_INDICATOR_MIN_PX - 1, false)).toBe(
        PULL_INDICATOR_MIN_PX,
      );
    });

    it("uses pull distance when above minimum", () => {
      expect(pullIndicatorSlotHeight(50, false)).toBe(50);
      expect(pullIndicatorSlotHeight(PULL_REFRESH_MAX, false)).toBe(
        PULL_REFRESH_MAX,
      );
    });
  });

  describe("isPullGesture", () => {
    it("detects downward pull with dominant vertical movement", () => {
      expect(isPullGesture(5, 20)).toBe(true);
      expect(isPullGesture(-5, 20)).toBe(true);
      expect(isPullGesture(0, 1)).toBe(true);
    });

    it("rejects upward or horizontal-dominant movement", () => {
      expect(isPullGesture(0, -5)).toBe(false);
      expect(isPullGesture(20, 10)).toBe(false);
      expect(isPullGesture(-20, 10)).toBe(false);
      expect(isPullGesture(0, 0)).toBe(false);
    });
  });
});
