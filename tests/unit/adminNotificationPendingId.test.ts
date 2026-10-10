import { describe, expect, it } from "vitest";
import { resolveAdminNotificationPendingRowId } from "../../src/react-app/features/notifications/adminNotificationPendingId";

describe("resolveAdminNotificationPendingRowId", () => {
  it("toggle pending のとき toggle の id を返す", () => {
    expect(
      resolveAdminNotificationPendingRowId(
        { isPending: true, variables: { id: "a" } },
        { isPending: false, variables: "b" },
      ),
    ).toBe("a");
  });

  it("delete pending のとき delete の variables を返す", () => {
    expect(
      resolveAdminNotificationPendingRowId(
        { isPending: false, variables: { id: "a" } },
        { isPending: true, variables: "b" },
      ),
    ).toBe("b");
  });

  it("toggle が pending でないとき delete の stale variables を使わない", () => {
    expect(
      resolveAdminNotificationPendingRowId(
        { isPending: false, variables: { id: "a" } },
        { isPending: false, variables: "b" },
      ),
    ).toBeUndefined();
  });
});
