import { SKIP_WAITING_MESSAGE_TYPE } from "@shared/sw-messages";

export interface ServiceWorkerUpdateState {
  registration: ServiceWorkerRegistration | null;
  isUpdateAvailable: boolean;
}

type ServiceWorkerUpdateListener = () => void;

let state: ServiceWorkerUpdateState = {
  registration: null,
  isUpdateAvailable: false,
};
let shouldReloadAfterControllerChange = false;
const listeners = new Set<ServiceWorkerUpdateListener>();

const DEFAULT_UPDATE_TIMEOUT_MS = 30_000;
const DEFAULT_ACTIVATION_TIMEOUT_MS = 5_000;

function publish(nextState: ServiceWorkerUpdateState): void {
  state = nextState;
  for (const listener of listeners) {
    listener();
  }
}

/** React などの UI 層が更新待ち状態を購読するための小さな外部ストア。 */
export function subscribeServiceWorkerUpdate(
  listener: ServiceWorkerUpdateListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServiceWorkerUpdateSnapshot(): ServiceWorkerUpdateState {
  return state;
}

export function setServiceWorkerRegistration(
  registration: ServiceWorkerRegistration,
): void {
  publish({ ...state, registration });
}

export function setWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
): void {
  publish({ registration, isUpdateAvailable: true });
}

export function dismissServiceWorkerUpdate(): void {
  publish({ ...state, isUpdateAvailable: false });
}

export function clearServiceWorkerUpdate(): void {
  publish({ registration: null, isUpdateAvailable: false });
}

/** 待機中の Worker がない場合も、次回の更新確認を実行する。 */
export async function requestServiceWorkerUpdate(): Promise<void> {
  await state.registration?.update();
}

function isPastInstalledState(state: ServiceWorkerState): boolean {
  return (
    state === "activating" || state === "activated" || state === "redundant"
  );
}

function waitForWorkerState(
  worker: ServiceWorker,
  targetState: ServiceWorkerState,
  timeoutMs: number,
): { promise: Promise<ServiceWorker | null>; cancel: () => void } {
  if (worker.state === targetState) {
    return { promise: Promise.resolve(worker), cancel: () => {} };
  }
  if (isPastInstalledState(worker.state)) {
    return { promise: Promise.resolve(null), cancel: () => {} };
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let onStateChange: (() => void) | undefined;
  let settled = false;

  const cancel = () => {
    if (settled) return;
    settled = true;
    if (timeout !== undefined) clearTimeout(timeout);
    if (onStateChange) {
      worker.removeEventListener("statechange", onStateChange);
    }
  };

  const promise = new Promise<ServiceWorker | null>((resolve) => {
    timeout = setTimeout(() => {
      cancel();
      resolve(null);
    }, timeoutMs);

    onStateChange = () => {
      if (worker.state === targetState) {
        settled = true;
        if (timeout !== undefined) clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange!);
        resolve(worker);
        return;
      }
      if (isPastInstalledState(worker.state)) {
        cancel();
        resolve(null);
      }
    };

    worker.addEventListener("statechange", onStateChange);
  });

  return { promise, cancel };
}

/**
 * 待機中 Worker があればそれを返す。なければ installing の installed 到達を待つ。
 * installing / waiting が共に無い場合は即 null（update() 後に新 SW が来ないケース）。
 */
export async function waitForInstalledWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<ServiceWorker | null> {
  if (registration.waiting) {
    return registration.waiting;
  }

  const installing = registration.installing;
  if (!installing) {
    return null;
  }

  if (isPastInstalledState(installing.state)) {
    return null;
  }

  const { promise } = waitForWorkerState(installing, "installed", timeoutMs);
  const installed = await promise;
  if (!installed) return null;
  return registration.waiting ?? installed;
}

function waitForControllerChange(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      resolve(false);
    }, timeoutMs);

    const onControllerChange = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      resolve(true);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
  });
}

/**
 * 待機中の Worker だけを有効化する。
 * controllerchange 後の reload は `shouldReloadForServiceWorkerControllerChange` が判断する。
 */
export function activateWaitingServiceWorker(): boolean {
  const waitingWorker = state.registration?.waiting;
  if (!waitingWorker) return false;

  shouldReloadAfterControllerChange = true;
  try {
    waitingWorker.postMessage({ type: SKIP_WAITING_MESSAGE_TYPE });
  } catch {
    shouldReloadAfterControllerChange = false;
    return false;
  }
  return true;
}

/** controllerchange をユーザー操作による更新として reload すべきか返す。 */
export function shouldReloadForServiceWorkerControllerChange(): boolean {
  const shouldReload = shouldReloadAfterControllerChange;
  shouldReloadAfterControllerChange = false;
  return shouldReload;
}

/** テスト用: controllerchange 待ちフラグの現在値。 */
export function getShouldReloadAfterControllerChangeForTests(): boolean {
  return shouldReloadAfterControllerChange;
}

/**
 * 利用者操作に応じて SW 更新を適用する。
 * `"reload"` のときだけ呼び出し側が `window.location.reload()` すべき（controllerchange で再読み込みされなかった場合）。
 */
export async function applyServiceWorkerUpdate(options?: {
  updateTimeoutMs?: number;
  activationTimeoutMs?: number;
}): Promise<"reload" | undefined> {
  const updateTimeoutMs = options?.updateTimeoutMs ?? DEFAULT_UPDATE_TIMEOUT_MS;
  const activationTimeoutMs =
    options?.activationTimeoutMs ?? DEFAULT_ACTIVATION_TIMEOUT_MS;
  const registration = state.registration;
  if (!registration) {
    return "reload";
  }

  let activated = activateWaitingServiceWorker();

  if (!activated) {
    try {
      await registration.update();
    } catch {
      return "reload";
    }

    if (!registration.waiting && !registration.installing) {
      return "reload";
    }

    const installedWorker = await waitForInstalledWorker(
      registration,
      updateTimeoutMs,
    );
    if (!installedWorker || !registration.waiting) {
      return "reload";
    }

    activated = activateWaitingServiceWorker();
    if (!activated) {
      return "reload";
    }
  }

  const controllerChanged = await waitForControllerChange(activationTimeoutMs);
  if (controllerChanged) {
    return undefined;
  }

  shouldReloadAfterControllerChange = false;
  return "reload";
}
