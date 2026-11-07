import { describe, expect, it } from "vitest";
import { normalizePushPayload } from "@shared/web-push";

describe("normalizePushPayload", () => {
  const defaultTitle = "学習記録シェア";

  it("uses default title when raw is not an object", () => {
    expect(normalizePushPayload(null, defaultTitle)).toEqual({
      title: defaultTitle,
    });
    expect(normalizePushPayload("x", defaultTitle)).toEqual({
      title: defaultTitle,
    });
  });

  it("keeps non-empty string title and optional body/data", () => {
    expect(
      normalizePushPayload(
        { title: " 通知 ", body: "本文", data: { recordId: "1" } },
        defaultTitle,
      ),
    ).toEqual({
      title: " 通知 ",
      body: "本文",
      data: { recordId: "1" },
    });
  });

  it("falls back to default title when title is empty or not a string", () => {
    expect(normalizePushPayload({ title: "" }, defaultTitle)).toEqual({
      title: defaultTitle,
    });
    expect(normalizePushPayload({ title: 1 }, defaultTitle)).toEqual({
      title: defaultTitle,
    });
  });

  it("ignores non-string body and non-plain-object data", () => {
    expect(
      normalizePushPayload(
        { title: "t", body: 1, data: ["x"] },
        defaultTitle,
      ),
    ).toEqual({ title: "t" });
  });
});
