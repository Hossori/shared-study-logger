import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SKIP_WAITING_MESSAGE_TYPE } from "@shared/sw-messages";
import {
  activateWaitingServiceWorker,
  applyServiceWorkerUpdate,
  clearServiceWorkerUpdate,
  getShouldReloadAfterControllerChangeForTests,
  setServiceWorkerRegistration,
  waitForInstalledWorker,
} from "../../src/react-app/features/pwa/serviceWorkerUpdate";

class MockServiceWorker {
  state: ServiceWorkerState;
  postMessage = vi.fn();
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(initialState: ServiceWorkerState = "installing") {
    this.state = initialState;
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  setState(next: ServiceWorkerState) {
    this.state = next;
    const event = new Event("statechange");
    for (const listener of this.listeners.get("statechange") ?? []) {
      listener(event);
    }
  }
}

class MockRegistration {
  private listeners = new Map<string, Set<(event: Event) => void>>();
  waiting: ServiceWorker | null = null;
  installing: ServiceWorker | null = null;
  update = vi.fn(async () => undefined);

  addEventListener(type: string, listener: (event: Event) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(type: string) {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

function createRegistration(): MockRegistration {
  return new MockRegistration();
}

describe("waitForInstalledWorker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves immediately when waiting worker exists", async () => {
    const registration = createRegistration();
    const waiting = new MockServiceWorker("installed");
    registration.waiting = waiting as unknown as ServiceWorker;

    await expect(
      waitForInstalledWorker(registration as unknown as ServiceWorkerRegistration, 1000),
    ).resolves.toBe(waiting);
  });

  it("waits for installing worker to reach installed", async () => {
    const registration = createRegistration();
    const installing = new MockServiceWorker("installing");
    registration.installing = installing as unknown as ServiceWorker;

    const promise = waitForInstalledWorker(
      registration as unknown as ServiceWorkerRegistration,
      5000,
    );
    installing.setState("installed");
    registration.waiting = installing as unknown as ServiceWorker;

    await expect(promise).resolves.toBe(installing);
  });

  it("returns null on redundant worker", async () => {
    const registration = createRegistration();
    const installing = new MockServiceWorker("installing");
    registration.installing = installing as unknown as ServiceWorker;

    const promise = waitForInstalledWorker(
      registration as unknown as ServiceWorkerRegistration,
      5000,
    );
    installing.setState("redundant");

    await expect(promise).resolves.toBeNull();
  });

  it("returns null on timeout", async () => {
    const registration = createRegistration();
    const installing = new MockServiceWorker("installing");
    registration.installing = installing as unknown as ServiceWorker;

    const promise = waitForInstalledWorker(
      registration as unknown as ServiceWorkerRegistration,
      1000,
    );
    vi.advanceTimersByTime(1001);

    await expect(promise).resolves.toBeNull();
  });

  it("returns null immediately when neither installing nor waiting exists", async () => {
    const registration = createRegistration();

    await expect(
      waitForInstalledWorker(
        registration as unknown as ServiceWorkerRegistration,
        30_000,
      ),
    ).resolves.toBeNull();
  });

  it.each(["activating", "activated"] as const)(
    "returns null when installing is already %s",
    async (workerState) => {
      const registration = createRegistration();
      const installing = new MockServiceWorker(workerState);
      registration.installing = installing as unknown as ServiceWorker;

      await expect(
        waitForInstalledWorker(
          registration as unknown as ServiceWorkerRegistration,
          5000,
        ),
      ).resolves.toBeNull();
    },
  );
});

describe("activateWaitingServiceWorker", () => {
  beforeEach(() => {
    clearServiceWorkerUpdate();
  });

  it("does not set reload flag when waiting worker is missing", () => {
    const registration = createRegistration();
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    expect(activateWaitingServiceWorker()).toBe(false);
    expect(getShouldReloadAfterControllerChangeForTests()).toBe(false);
  });

  it("posts skip-waiting message and sets reload flag", () => {
    const registration = createRegistration();
    const waiting = new MockServiceWorker("installed");
    registration.waiting = waiting as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    expect(activateWaitingServiceWorker()).toBe(true);
    expect(waiting.postMessage).toHaveBeenCalledWith({
      type: SKIP_WAITING_MESSAGE_TYPE,
    });
    expect(getShouldReloadAfterControllerChangeForTests()).toBe(true);
  });

  it("clears reload flag when postMessage throws", () => {
    const registration = createRegistration();
    const waiting = new MockServiceWorker("installed");
    waiting.postMessage.mockImplementation(() => {
      throw new Error("postMessage failed");
    });
    registration.waiting = waiting as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    expect(activateWaitingServiceWorker()).toBe(false);
    expect(getShouldReloadAfterControllerChangeForTests()).toBe(false);
  });
});

describe("applyServiceWorkerUpdate", () => {
  const swControllerTarget = {
    listeners: new Set<(event: Event) => void>(),
    addEventListener(_type: string, listener: (event: Event) => void) {
      this.listeners.add(listener);
    },
    removeEventListener(_type: string, listener: (event: Event) => void) {
      this.listeners.delete(listener);
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    clearServiceWorkerUpdate();
    vi.stubGlobal("navigator", {
      serviceWorker: swControllerTarget,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function dispatchControllerChange() {
    const event = new Event("controllerchange");
    for (const listener of swControllerTarget.listeners) {
      listener(event);
    }
  }

  it("activates existing waiting worker and waits for controllerchange", async () => {
    const registration = createRegistration();
    const waiting = new MockServiceWorker("installed");
    registration.waiting = waiting as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    const promise = applyServiceWorkerUpdate({
      activationTimeoutMs: 5000,
    });
    dispatchControllerChange();

    await expect(promise).resolves.toBeUndefined();
    expect(getShouldReloadAfterControllerChangeForTests()).toBe(true);
  });

  it("returns reload when controllerchange does not arrive in time", async () => {
    const registration = createRegistration();
    const waiting = new MockServiceWorker("installed");
    registration.waiting = waiting as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    const promise = applyServiceWorkerUpdate({
      activationTimeoutMs: 5000,
    });
    await vi.advanceTimersByTimeAsync(5001);

    await expect(promise).resolves.toBe("reload");
    expect(getShouldReloadAfterControllerChangeForTests()).toBe(false);
  });

  it("runs update(), waits for installed, then activates", async () => {
    const registration = createRegistration();
    const installing = new MockServiceWorker("installing");
    registration.installing = installing as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    const promise = applyServiceWorkerUpdate({
      updateTimeoutMs: 5000,
      activationTimeoutMs: 5000,
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(registration.update).toHaveBeenCalled();

    registration.waiting = installing as unknown as ServiceWorker;
    installing.setState("installed");
    await vi.advanceTimersByTimeAsync(0);
    dispatchControllerChange();

    await expect(promise).resolves.toBeUndefined();
    expect(installing.postMessage).toHaveBeenCalled();
  });

  it("returns reload quickly when update() leaves no installing or waiting worker", async () => {
    const registration = createRegistration();
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    const promise = applyServiceWorkerUpdate({ updateTimeoutMs: 30_000 });
    await vi.advanceTimersByTimeAsync(0);

    await expect(promise).resolves.toBe("reload");
    expect(registration.update).toHaveBeenCalled();
  });

  it("returns reload when registration.update fails", async () => {
    const registration = createRegistration();
    registration.update.mockRejectedValue(new Error("update failed"));
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    await expect(
      applyServiceWorkerUpdate({ activationTimeoutMs: 1000 }),
    ).resolves.toBe("reload");
  });

  it("returns reload when installed worker wait times out", async () => {
    const registration = createRegistration();
    const installing = new MockServiceWorker("installing");
    registration.installing = installing as unknown as ServiceWorker;
    setServiceWorkerRegistration(registration as unknown as ServiceWorkerRegistration);

    const promise = applyServiceWorkerUpdate({
      updateTimeoutMs: 1000,
      activationTimeoutMs: 5000,
    });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1001);

    await expect(promise).resolves.toBe("reload");
  });
});
