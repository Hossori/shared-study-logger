import { afterEach, describe, expect, it, vi } from "vitest";
import { isIosNonStandalone } from "../../src/react-app/lib/iosStandalone";

function stubNavigator(options: {
  userAgent: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}) {
  const matchMedia = vi.fn((query: string) => ({
    matches:
      query === "(display-mode: standalone)" &&
      (options.displayModeStandalone ?? false),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("navigator", {
    userAgent: options.userAgent,
    maxTouchPoints: options.maxTouchPoints ?? 0,
    standalone: options.standalone,
  });
  vi.stubGlobal("window", {
    matchMedia,
  });
}

describe("isIosNonStandalone", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true for iPhone Safari (non-standalone)", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    expect(isIosNonStandalone()).toBe(true);
  });

  it("returns true for iPad UA (non-standalone)", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    expect(isIosNonStandalone()).toBe(true);
  });

  it("returns true for iPadOS desktop UA (Macintosh + touch)", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      maxTouchPoints: 5,
    });
    expect(isIosNonStandalone()).toBe(true);
  });

  it("returns false when iOS is standalone", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      standalone: true,
    });
    expect(isIosNonStandalone()).toBe(false);
  });

  it("returns false when iPhone reports display-mode standalone", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      displayModeStandalone: true,
    });
    expect(isIosNonStandalone()).toBe(false);
  });

  it("returns false when iPadOS desktop UA reports display-mode standalone", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      maxTouchPoints: 5,
      displayModeStandalone: true,
    });
    expect(isIosNonStandalone()).toBe(false);
  });

  it("returns false for desktop Mac without touch", () => {
    stubNavigator({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      maxTouchPoints: 0,
    });
    expect(isIosNonStandalone()).toBe(false);
  });
});
