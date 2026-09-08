/**
 * 先頭エッジの下方向ジェスチャ状態機械（DOM 非依存）。
 * Touch / Pointer は channel + source に正規化してから渡す。
 */
import {
  applyPullResistance,
  isPullGesture,
  PULL_ACTIVATION_PX,
  PULL_REFRESH_HOLD_PX,
  shouldTriggerRefresh,
} from "./pullToRefresh";

export type PointerSource = "touch" | "mouse" | "pen";
export type GestureChannel = "touch" | "pointer";
export type PullGestureStatus = "idle" | "tracking" | "pulling" | "refreshing";

export type PullGestureState = {
  status: PullGestureStatus;
  inputLock: GestureChannel | null;
  startX: number;
  startY: number;
  id: number;
  source: PointerSource | null;
  pullDistance: number;
};

export type PullGestureEvent =
  | {
      type: "start";
      channel: GestureChannel;
      source: PointerSource;
      x: number;
      y: number;
      id: number;
      scrollTop: number;
    }
  | {
      type: "move";
      channel: GestureChannel;
      x: number;
      y: number;
      id: number;
      scrollTop: number;
    }
  | {
      type: "end";
      channel: GestureChannel;
      id: number;
    }
  | {
      type: "cancel";
      channel: GestureChannel;
      id: number;
    }
  | { type: "refresh_settled" };

export type PullGestureEffect =
  | "preventDefault"
  | "setTouchActionNone"
  | "clearTouchAction"
  | "triggerRefresh";

export type PullGestureOptions = {
  /** true なら距離追跡と更新発火。false なら先頭の preventDefault のみ */
  trackPull: boolean;
};

export function createIdlePullGestureState(): PullGestureState {
  return {
    status: "idle",
    inputLock: null,
    startX: 0,
    startY: 0,
    id: 0,
    source: null,
    pullDistance: 0,
  };
}

export function pullGestureUi(state: PullGestureState): {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
} {
  return {
    pullDistance: state.pullDistance,
    isPulling: state.status === "pulling",
    isRefreshing: state.status === "refreshing",
  };
}

function isMouse(state: PullGestureState): boolean {
  return state.source === "mouse";
}

function sameSession(
  state: PullGestureState,
  channel: GestureChannel,
  id: number,
): boolean {
  return state.inputLock === channel && state.id === id;
}

function pointerBlockedByTouch(
  state: PullGestureState,
  channel: GestureChannel,
): boolean {
  return channel === "pointer" && state.inputLock === "touch";
}

function reduceStart(
  state: PullGestureState,
  event: Extract<PullGestureEvent, { type: "start" }>,
  options: PullGestureOptions,
): { state: PullGestureState; effects: PullGestureEffect[] } {
  if (state.status === "refreshing") {
    return { state, effects: [] };
  }
  if (pointerBlockedByTouch(state, event.channel)) {
    return { state, effects: [] };
  }
  if (event.scrollTop > 0) {
    return { state, effects: [] };
  }

  const effects: PullGestureEffect[] = [];
  if (event.channel === "touch") {
    effects.push("clearTouchAction");
  }
  if (
    options.trackPull &&
    event.channel === "pointer" &&
    event.source !== "mouse"
  ) {
    effects.push("setTouchActionNone");
  }

  return {
    state: {
      status: "tracking",
      inputLock: event.channel,
      startX: event.x,
      startY: event.y,
      id: event.id,
      source: event.source,
      pullDistance: 0,
    },
    effects,
  };
}

function reduceMove(
  state: PullGestureState,
  event: Extract<PullGestureEvent, { type: "move" }>,
  options: PullGestureOptions,
): { state: PullGestureState; effects: PullGestureEffect[] } {
  if (state.status === "refreshing" || state.status === "idle") {
    return { state, effects: [] };
  }
  if (!sameSession(state, event.channel, event.id)) {
    return { state, effects: [] };
  }

  if (!options.trackPull) {
    if (event.scrollTop > 0) {
      return { state: createIdlePullGestureState(), effects: [] };
    }
    const deltaX = event.x - state.startX;
    const deltaY = event.y - state.startY;
    if (deltaY <= 0) {
      return { state, effects: [] };
    }
    if (!isPullGesture(deltaX, deltaY)) {
      return { state, effects: [] };
    }
    return { state, effects: ["preventDefault"] };
  }

  const deltaX = event.x - state.startX;
  const deltaY = event.y - state.startY;

  if (deltaY < 0) {
    return {
      state: createIdlePullGestureState(),
      effects: ["clearTouchAction"],
    };
  }
  if (!isPullGesture(deltaX, deltaY)) {
    return { state, effects: [] };
  }

  const mouse = isMouse(state);
  if (state.status === "tracking" && deltaY < PULL_ACTIVATION_PX) {
    if (mouse) {
      return { state, effects: [] };
    }
    return {
      state: {
        ...state,
        pullDistance: applyPullResistance(deltaY),
      },
      effects: ["preventDefault"],
    };
  }

  return {
    state: {
      ...state,
      status: "pulling",
      pullDistance: applyPullResistance(deltaY),
    },
    effects: ["preventDefault"],
  };
}

function reduceEnd(
  state: PullGestureState,
  event: Extract<PullGestureEvent, { type: "end" }>,
  options: PullGestureOptions,
): { state: PullGestureState; effects: PullGestureEffect[] } {
  if (state.status === "refreshing") {
    if (
      state.inputLock === null ||
      !sameSession(state, event.channel, event.id)
    ) {
      return { state, effects: [] };
    }
    return {
      state: { ...state, inputLock: null, source: null },
      effects: ["clearTouchAction"],
    };
  }

  if (state.status === "idle") {
    return { state, effects: [] };
  }
  if (!sameSession(state, event.channel, event.id)) {
    return { state, effects: [] };
  }

  const effects: PullGestureEffect[] = ["clearTouchAction"];
  if (
    options.trackPull &&
    state.status === "pulling" &&
    shouldTriggerRefresh(state.pullDistance)
  ) {
    return {
      state: {
        ...state,
        status: "refreshing",
        inputLock: null,
        source: null,
        pullDistance: PULL_REFRESH_HOLD_PX,
      },
      effects: [...effects, "triggerRefresh"],
    };
  }

  return { state: createIdlePullGestureState(), effects };
}

function reduceCancel(
  state: PullGestureState,
  event: Extract<PullGestureEvent, { type: "cancel" }>,
): { state: PullGestureState; effects: PullGestureEffect[] } {
  if (state.status === "idle") {
    return { state, effects: [] };
  }
  if (state.status === "refreshing") {
    if (
      state.inputLock === null ||
      !sameSession(state, event.channel, event.id)
    ) {
      return { state, effects: [] };
    }
    return {
      state: { ...state, inputLock: null, source: null },
      effects: ["clearTouchAction"],
    };
  }
  if (!sameSession(state, event.channel, event.id)) {
    return { state, effects: [] };
  }
  return { state: createIdlePullGestureState(), effects: ["clearTouchAction"] };
}

export function reducePullGesture(
  state: PullGestureState,
  event: PullGestureEvent,
  options: PullGestureOptions,
): { state: PullGestureState; effects: PullGestureEffect[] } {
  switch (event.type) {
    case "start":
      return reduceStart(state, event, options);
    case "move":
      return reduceMove(state, event, options);
    case "end":
      return reduceEnd(state, event, options);
    case "cancel":
      return reduceCancel(state, event);
    case "refresh_settled":
      if (state.status !== "refreshing") {
        return { state, effects: [] };
      }
      return {
        state: createIdlePullGestureState(),
        effects: ["clearTouchAction"],
      };
  }
}
