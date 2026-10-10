import { afterEach, describe, expect, it, vi } from "vitest";
import { unsubscribePushOnLogout } from "../../src/react-app/features/push/logoutCleanup";

vi.mock("../../src/react-app/lib/api", () => ({
  apiDelete: vi.fn(),
}));

vi.mock("../../src/react-app/lib/iosStandalone", () => ({
  isIosNonStandalone: vi.fn(() => false),
}));

vi.mock("../../src/react-app/features/push/vapid", () => ({
  isPushSupported: vi.fn(() => true),
}));

import { apiDelete } from "../../src/react-app/lib/api";

describe("unsubscribePushOnLogout", () => {
  const unsubscribe = vi.fn(() => Promise.resolve(true));

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function stubPushEnvironment(options?: {
    deleteFails?: boolean;
    unsubscribeFails?: boolean;
    hangReady?: boolean;
  }) {
    const getSubscription = vi.fn(() =>
      Promise.resolve({
        endpoint: "https://push.example/ep",
        unsubscribe: options?.unsubscribeFails
          ? vi.fn(() => Promise.reject(new Error("unsub fail")))
          : unsubscribe,
      }),
    );

    const registration = {
      pushManager: { getSubscription },
    };

    if (options?.hangReady) {
      vi.stubGlobal("navigator", {
        serviceWorker: {
          ready: new Promise(() => {}),
        },
      });
    } else {
      vi.stubGlobal("navigator", {
        serviceWorker: {
          ready: Promise.resolve(registration),
        },
      });
    }

    if (options?.deleteFails) {
      vi.mocked(apiDelete).mockRejectedValue(new Error("delete fail"));
    } else {
      vi.mocked(apiDelete).mockResolvedValue({ ok: true });
    }
  }

  it("calls DELETE and unsubscribe when subscription exists", async () => {
    stubPushEnvironment();
    await unsubscribePushOnLogout();
    expect(apiDelete).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.anything(),
      { endpoint: "https://push.example/ep" },
    );
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("still unsubscribes when DELETE fails", async () => {
    stubPushEnvironment({ deleteFails: true });
    await unsubscribePushOnLogout();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("resolves on hang or exception", async () => {
    stubPushEnvironment({ hangReady: true });
    await expect(
      Promise.race([
        unsubscribePushOnLogout(),
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]),
    ).resolves.toBeUndefined();
  });
});
