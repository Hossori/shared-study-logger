import { describe, expect, it } from "vitest";
import {
  orientationKindFromSignals,
  viewportContentForResettle,
} from "../../src/react-app/lib/orientationViewport";

const VIEWPORT = "width=device-width, initial-scale=1.0, viewport-fit=cover";

describe("orientationViewport", () => {
  it("prefers the device orientation over a stale viewport width", () => {
    expect(
      orientationKindFromSignals({
        width: 844,
        height: 390,
        windowOrientation: 0,
      }),
    ).toBe("portrait");
    expect(
      orientationKindFromSignals({
        width: 844,
        height: 390,
        screenOrientationType: "landscape-primary",
        windowOrientation: 0,
      }),
    ).toBe("portrait");
    expect(
      orientationKindFromSignals({
        width: 390,
        height: 844,
        screenOrientationType: "landscape-primary",
      }),
    ).toBe("landscape");
    expect(orientationKindFromSignals({ width: 844, height: 390 })).toBe(
      "landscape",
    );
    expect(orientationKindFromSignals({ width: 390, height: 390 })).toBe(
      "portrait",
    );
  });

  it("bumps maximum-scale once and restores the original content", () => {
    expect(viewportContentForResettle(VIEWPORT)).toEqual({
      bumped: `${VIEWPORT}, maximum-scale=1`,
      restored: VIEWPORT,
    });
  });

  it("leaves content that already sets maximum-scale unchanged", () => {
    const content = `${VIEWPORT}, maximum-scale=2`;
    expect(viewportContentForResettle(content)).toEqual({
      bumped: content,
      restored: content,
    });
  });
});
