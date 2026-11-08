import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function stubPushEnvironment(options?: {
    deleteFails?: boolean;
    unsubscribeFails?: boolean;
    hangReady?: boolean;
    hangGetSubscription?: boolean;
    readyRejects?: boolean;
  }) {
    const unsubscribe = vi.fn(() => Promise.resolve(true));

    const getSubscription = vi.fn(() => {
      if (options?.hangGetSubscription) {
        return new Promise(() => {});
      }
      return Promise.resolve({
        endpoint: "https://push.example/ep",
        unsubscribe: options?.unsubscribeFails
          ? vi.fn(() => Promise.reject(new Error("unsub fail")))
          : unsubscribe,
      });
    });

    const registration = {
      pushManager: { getSubscription },
    };

    if (options?.hangReady) {
      vi.stubGlobal("navigator", {
        serviceWorker: {
          ready: new Promise(() => {}),
        },
      });
    } else if (options?.readyRejects) {
      vi.stubGlobal("navigator", {
        serviceWorker: {
          ready: Promise.reject(new Error("sw error")),
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

    return { unsubscribe };
  }

  it("calls DELETE and unsubscribe when subscription exists", async () => {
    const { unsubscribe } = stubPushEnvironment();
    await unsubscribePushOnLogout();
    expect(apiDelete).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.anything(),
      { endpoint: "https://push.example/ep" },
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("still unsubscribes when DELETE fails", async () => {
    const { unsubscribe } = stubPushEnvironment({ deleteFails: true });
    await unsubscribePushOnLogout();
    expect(apiDelete).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("resolves within 5s when push cleanup hangs", async () => {
    vi.useFakeTimers();
    stubPushEnvironment({ hangGetSubscription: true });
    const promise = unsubscribePushOnLogout();
    let settled = false;
    void promise.finally(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves when serviceWorker.ready rejects", async () => {
    stubPushEnvironment({ readyRejects: true });
    await expect(unsubscribePushOnLogout()).resolves.toBeUndefined();
    expect(apiDelete).not.toHaveBeenCalled();
  });
});
