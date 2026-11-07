import { describe, expect, it } from "vitest";
import { withTimeout } from "../../src/react-app/features/push/withTimeout";

describe("withTimeout", () => {
  it("resolves when promise finishes in time", async () => {
    await expect(withTimeout(Promise.resolve(42), 100)).resolves.toBe(42);
  });

  it("rejects when promise exceeds timeout", async () => {
    await expect(
      withTimeout(new Promise(() => {}), 20, "slow"),
    ).rejects.toThrow("slow");
  });
});
