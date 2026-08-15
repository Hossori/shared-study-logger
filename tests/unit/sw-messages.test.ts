import { describe, expect, it } from "vitest";
import {
  isSkipWaitingMessage,
  SKIP_WAITING_MESSAGE_TYPE,
} from "../../shared/sw-messages";

describe("isSkipWaitingMessage", () => {
  it("accepts only the explicit service worker activation request", () => {
    expect(isSkipWaitingMessage({ type: SKIP_WAITING_MESSAGE_TYPE })).toBe(
      true,
    );
  });

  it.each([
    undefined,
    null,
    "shared-study-logger:skip-waiting",
    {},
    { type: "shared-study-logger:notification-click" },
  ])("rejects unrelated payload: %j", (message) => {
    expect(isSkipWaitingMessage(message)).toBe(false);
  });
});
