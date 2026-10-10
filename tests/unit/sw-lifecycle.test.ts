import { describe, expect, it } from "vitest";
import { getInstallMigrationAction } from "@shared/sw-lifecycle";

describe("getInstallMigrationAction", () => {
  it("returns none when migration marker already exists", () => {
    expect(
      getInstallMigrationAction({ hasMarker: true, hasActiveWorker: true }),
    ).toBe("none");
    expect(
      getInstallMigrationAction({ hasMarker: true, hasActiveWorker: false }),
    ).toBe("none");
  });

  it("returns skip-waiting when marker is missing and an active worker exists", () => {
    expect(
      getInstallMigrationAction({ hasMarker: false, hasActiveWorker: true }),
    ).toBe("skip-waiting");
  });

  it("returns save-marker on fresh install without active worker", () => {
    expect(
      getInstallMigrationAction({ hasMarker: false, hasActiveWorker: false }),
    ).toBe("save-marker");
  });
});
