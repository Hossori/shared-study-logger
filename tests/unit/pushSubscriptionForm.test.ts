import { describe, expect, it } from "vitest";
import { PushSubscribeFormSchema } from "../../src/react-app/features/push/pushSubscriptionForm";

describe("PushSubscribeFormSchema", () => {
  const valid = {
    endpoint: "https://push.example/abc",
    keys: {
      p256dh: "key-p256dh",
      auth: "key-auth",
    },
  };

  it("accepts a valid subscription payload", () => {
    expect(PushSubscribeFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty endpoint or keys", () => {
    expect(
      PushSubscribeFormSchema.safeParse({ ...valid, endpoint: "" }).success,
    ).toBe(false);
    expect(
      PushSubscribeFormSchema.safeParse({
        ...valid,
        keys: { ...valid.keys, p256dh: "" },
      }).success,
    ).toBe(false);
    expect(
      PushSubscribeFormSchema.safeParse({
        ...valid,
        keys: { ...valid.keys, auth: "" },
      }).success,
    ).toBe(false);
  });
});
