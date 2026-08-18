import { SKIP_WAITING_MESSAGE_TYPE } from "../../../shared/sw-messages";

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

/**
 * 待機中の Worker だけを有効化する。
 * controllerchange 後の reload は `shouldReloadForServiceWorkerControllerChange` が判断する。
 */
export function activateWaitingServiceWorker(): boolean {
  const waitingWorker = state.registration?.waiting;
  if (!waitingWorker) return false;

  shouldReloadAfterControllerChange = true;
  waitingWorker.postMessage({ type: SKIP_WAITING_MESSAGE_TYPE });
  return true;
}

/** controllerchange をユーザー操作による更新として reload すべきか返す。 */
export function shouldReloadForServiceWorkerControllerChange(): boolean {
  const shouldReload = shouldReloadAfterControllerChange;
  shouldReloadAfterControllerChange = false;
  return shouldReload;
}
