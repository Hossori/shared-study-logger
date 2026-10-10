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

function waitForWorkerState(
  worker: ServiceWorker,
  targetState: ServiceWorkerState,
  timeoutMs: number,
): Promise<ServiceWorker | null> {
  if (worker.state === targetState) {
    return Promise.resolve(worker);
  }
  if (worker.state === "redundant") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      resolve(null);
    }, timeoutMs);

    const onStateChange = () => {
      if (worker.state === targetState) {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve(worker);
        return;
      }
      if (worker.state === "redundant") {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve(null);
      }
    };

    worker.addEventListener("statechange", onStateChange);
  });
}

/**
 * 待機中 Worker があればそれを返す。なければ installing の installed 到達を待つ。
 */
export async function waitForInstalledWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<ServiceWorker | null> {
  if (registration.waiting) {
    return registration.waiting;
  }

  const installing = registration.installing;
  if (installing) {
    const installed = await waitForWorkerState(
      installing,
      "installed",
      timeoutMs,
    );
    if (!installed) return null;
    return registration.waiting ?? installed;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (worker: ServiceWorker | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      registration.removeEventListener("updatefound", onUpdateFound);
      resolve(worker);
    };

    const timeout = setTimeout(() => finish(null), timeoutMs);

    const onUpdateFound = () => {
      const worker = registration.installing;
      if (!worker) {
        finish(null);
        return;
      }
      void waitForWorkerState(worker, "installed", timeoutMs).then(
        (installed) => {
          if (!installed) {
            finish(null);
            return;
          }
          finish(registration.waiting ?? installed);
        },
      );
    };

    registration.addEventListener("updatefound", onUpdateFound);
  });
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
