import { describe, expect, it } from "vitest";
import {
  createIdlePullGestureState,
  pullGestureUi,
  reducePullGesture,
  type PullGestureEvent,
  type PullGestureOptions,
  type PullGestureState,
} from "../../src/react-app/lib/pullGesture";
import {
  applyPullResistance,
  PULL_ACTIVATION_PX,
  PULL_REFRESH_HOLD_PX,
  PULL_REFRESH_THRESHOLD,
} from "../../src/react-app/lib/pullToRefresh";

const TRACK: PullGestureOptions = { trackPull: true };
const PREVENT: PullGestureOptions = { trackPull: false };

function reduceAll(
  events: PullGestureEvent[],
  options: PullGestureOptions = TRACK,
  initial: PullGestureState = createIdlePullGestureState(),
) {
  let state = initial;
  let effects: ReturnType<typeof reducePullGesture>["effects"] = [];
  for (const event of events) {
    const result = reducePullGesture(state, event, options);
    state = result.state;
    effects = result.effects;
  }
  return { state, effects };
}

function startTouch(
  overrides: Partial<Extract<PullGestureEvent, { type: "start" }>> = {},
): PullGestureEvent {
  return {
    type: "start",
    channel: "touch",
    source: "touch",
    id: 1,
    x: 0,
    y: 0,
    scrollTop: 0,
    ...overrides,
  };
}

function startPointer(
  source: "mouse" | "touch" | "pen" = "mouse",
  overrides: Partial<Extract<PullGestureEvent, { type: "start" }>> = {},
): PullGestureEvent {
  return {
    type: "start",
    channel: "pointer",
    source,
    id: 7,
    x: 0,
    y: 0,
    scrollTop: 0,
    ...overrides,
  };
}

function move(
  channel: "touch" | "pointer",
  x: number,
  y: number,
  id: number,
  scrollTop = 0,
): PullGestureEvent {
  return { type: "move", channel, x, y, id, scrollTop };
}

describe("reducePullGesture", () => {
  describe("activation", () => {
    it("keeps tracking and records distance for touch before activation", () => {
      const below = PULL_ACTIVATION_PX - 1;
      const { state, effects } = reduceAll([
        startTouch(),
        move("touch", 0, below, 1),
      ]);
      expect(state.status).toBe("tracking");
      expect(state.pullDistance).toBe(applyPullResistance(below));
      expect(effects).toEqual(["preventDefault"]);
      expect(pullGestureUi(state).isPulling).toBe(false);
    });

    it("enters pulling once touch movement reaches activation", () => {
      const { state, effects } = reduceAll([
        startTouch(),
        move("touch", 0, PULL_ACTIVATION_PX, 1),
      ]);
      expect(state.status).toBe("pulling");
      expect(state.pullDistance).toBe(applyPullResistance(PULL_ACTIVATION_PX));
      expect(effects).toEqual(["preventDefault"]);
      expect(pullGestureUi(state).isPulling).toBe(true);
    });
  });

  describe("mouse vs non-mouse", () => {
    it("does not update distance or preventDefault for mouse before activation", () => {
      const { state, effects } = reduceAll([
        startPointer("mouse"),
        move("pointer", 0, PULL_ACTIVATION_PX - 1, 7),
      ]);
      expect(state.status).toBe("tracking");
      expect(state.pullDistance).toBe(0);
      expect(effects).toEqual([]);
    });

    it("prevents default and records distance after mouse activation", () => {
      const { state, effects } = reduceAll([
        startPointer("mouse"),
        move("pointer", 0, PULL_ACTIVATION_PX, 7),
      ]);
      expect(state.status).toBe("pulling");
      expect(state.pullDistance).toBe(applyPullResistance(PULL_ACTIVATION_PX));
      expect(effects).toEqual(["preventDefault"]);
    });

    it("sets touch-action none on non-mouse pointer start", () => {
      const { effects } = reduceAll([startPointer("touch")]);
      expect(effects).toEqual(["setTouchActionNone"]);
    });

    it("does not set touch-action on mouse start", () => {
      const { effects } = reduceAll([startPointer("mouse")]);
      expect(effects).toEqual([]);
    });
  });

  describe("touch lock", () => {
    it("ignores pointer events while a touch session owns the gesture", () => {
      const started = reduceAll([startTouch()]);
      const pointerStart = reducePullGesture(
        started.state,
        startPointer("mouse"),
        TRACK,
      );
      expect(pointerStart.state).toEqual(started.state);
      expect(pointerStart.effects).toEqual([]);

      const pointerMove = reducePullGesture(
        started.state,
        move("pointer", 0, 40, 7),
        TRACK,
      );
      expect(pointerMove.state).toEqual(started.state);
    });

    it("lets touch start take over a pointer session", () => {
      const { state, effects } = reduceAll([
        startPointer("mouse"),
        startTouch({ id: 2 }),
      ]);
      expect(state.inputLock).toBe("touch");
      expect(state.id).toBe(2);
      expect(state.status).toBe("tracking");
      expect(effects).toEqual(["clearTouchAction"]);
    });
  });

  describe("refresh", () => {
    it("triggers refresh when pulling past the threshold and ending", () => {
      const rawY = PULL_REFRESH_THRESHOLD / 0.5;
      const { state, effects } = reduceAll([
        startTouch(),
        move("touch", 0, rawY, 1),
        { type: "end", channel: "touch", id: 1 },
      ]);
      expect(state.status).toBe("refreshing");
      expect(state.pullDistance).toBe(PULL_REFRESH_HOLD_PX);
      expect(effects).toEqual(["clearTouchAction", "triggerRefresh"]);
      expect(pullGestureUi(state).isRefreshing).toBe(true);
    });

    it("does not trigger refresh on cancel past the threshold", () => {
      const rawY = PULL_REFRESH_THRESHOLD / 0.5;
      const { state, effects } = reduceAll([
        startTouch(),
        move("touch", 0, rawY, 1),
        { type: "cancel", channel: "touch", id: 1 },
      ]);
      expect(state.status).toBe("idle");
      expect(state.pullDistance).toBe(0);
      expect(effects).toEqual(["clearTouchAction"]);
    });

    it("ignores a new start while refreshing", () => {
      const rawY = PULL_REFRESH_THRESHOLD / 0.5;
      const refreshing = reduceAll([
        startTouch(),
        move("touch", 0, rawY, 1),
        { type: "end", channel: "touch", id: 1 },
      ]);
      const next = reducePullGesture(refreshing.state, startTouch({ id: 3 }), TRACK);
      expect(next.state.status).toBe("refreshing");
      expect(next.effects).toEqual([]);
    });

    it("returns to idle on refresh_settled", () => {
      const rawY = PULL_REFRESH_THRESHOLD / 0.5;
      const refreshing = reduceAll([
        startTouch(),
        move("touch", 0, rawY, 1),
        { type: "end", channel: "touch", id: 1 },
      ]);
      const settled = reducePullGesture(
        refreshing.state,
        { type: "refresh_settled" },
        TRACK,
      );
      expect(settled.state).toEqual(createIdlePullGestureState());
      expect(pullGestureUi(settled.state).isRefreshing).toBe(false);
    });
  });

  describe("scroll and direction", () => {
    it("ignores start when scrollTop is not 0", () => {
      const { state, effects } = reduceAll([startTouch({ scrollTop: 12 })]);
      expect(state.status).toBe("idle");
      expect(effects).toEqual([]);
    });

    it("cancels a pull when movement goes upward", () => {
      const { state } = reduceAll([
        startTouch(),
        move("touch", 0, 20, 1),
        move("touch", 0, -4, 1),
      ]);
      expect(state.status).toBe("idle");
      expect(state.pullDistance).toBe(0);
    });

    it("does not preventDefault for horizontal-dominant movement", () => {
      const { state, effects } = reduceAll([
        startTouch(),
        move("touch", 30, 10, 1),
      ]);
      expect(state.status).toBe("tracking");
      expect(effects).toEqual([]);
    });
  });

  describe("trackPull false", () => {
    it("prevents default without recording distance or pulling", () => {
      const { state, effects } = reduceAll(
        [startTouch(), move("touch", 0, 40, 1)],
        PREVENT,
      );
      expect(state.status).toBe("tracking");
      expect(state.pullDistance).toBe(0);
      expect(effects).toEqual(["preventDefault"]);
      expect(pullGestureUi(state).isPulling).toBe(false);
    });

    it("does not trigger refresh on end", () => {
      const { state, effects } = reduceAll(
        [
          startTouch(),
          move("touch", 0, 200, 1),
          { type: "end", channel: "touch", id: 1 },
        ],
        PREVENT,
      );
      expect(state.status).toBe("idle");
      expect(effects).toEqual(["clearTouchAction"]);
    });

    it("clears tracking when scrollTop leaves 0", () => {
      const { state } = reduceAll(
        [startTouch(), move("touch", 0, 20, 1, 8)],
        PREVENT,
      );
      expect(state.status).toBe("idle");
    });
  });
});
