/**
 * API クライアントと更新必須 UI の疎結合な通知口。
 * UI 層はこの関数を購読して状態を更新し、API 層は UI / store を import しない。
 */
export interface ClientApiUpdateRequiredEvent {
  status: 426;
  body: unknown;
}

export type ClientApiUpdateRequiredListener = (
  event: ClientApiUpdateRequiredEvent,
) => void;

const listeners = new Set<ClientApiUpdateRequiredListener>();
let latestEvent: ClientApiUpdateRequiredEvent | null = null;

/** 更新必須が一度でも検出されたかを返す。再読み込みでモジュール状態は初期化される。 */
export function getClientApiUpdateRequiredEvent(): ClientApiUpdateRequiredEvent | null {
  return latestEvent;
}

export function subscribeClientApiUpdateRequired(
  listener: ClientApiUpdateRequiredListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyClientApiUpdateRequired(
  event: ClientApiUpdateRequiredEvent,
): void {
  latestEvent = event;
  for (const listener of listeners) {
    listener(event);
  }
}
