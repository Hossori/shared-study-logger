import { describe, expect, it } from "vitest";
import {
  applyPullResistance,
  isPullGesture,
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
    it("uses default threshold", () => {
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD - 1)).toBe(false);
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD)).toBe(true);
      expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD + 10)).toBe(true);
    });

    it("accepts custom threshold", () => {
      expect(shouldTriggerRefresh(30, 40)).toBe(false);
      expect(shouldTriggerRefresh(40, 40)).toBe(true);
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
