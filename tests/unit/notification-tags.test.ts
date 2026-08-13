import { describe, expect, it } from "vitest";
import { getStudyRecordNotificationTag } from "../../shared/notification-tags";

describe("getStudyRecordNotificationTag", () => {
  it("returns a stable tag for a record notification", () => {
    expect(
      getStudyRecordNotificationTag({
        recordId: "00000000-0000-4000-b000-000000000001",
      }),
    ).toBe("study-record:00000000-0000-4000-b000-000000000001");
  });

  it.each([
    undefined,
    {},
    { recordId: "" },
    { recordId: " \t" },
    { recordId: 123 },
    { recordId: "record\u0000id" },
  ])("returns undefined for an unsafe or missing record ID", (data) => {
    expect(getStudyRecordNotificationTag(data)).toBeUndefined();
  });
});
