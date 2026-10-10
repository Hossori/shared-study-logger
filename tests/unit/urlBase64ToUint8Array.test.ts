import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "@shared/web-push";

describe("urlBase64ToUint8Array", () => {
  it("decodes base64url without padding", () => {
    const bytes = urlBase64ToUint8Array("aGVsbG8");
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it("decodes -_8 to [251, 255]", () => {
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255]);
  });

  it("produces the same bytes with or without padding", () => {
    const unpadded = urlBase64ToUint8Array("-_8");
    const padded = urlBase64ToUint8Array("-_8=");
    expect(Array.from(unpadded)).toEqual(Array.from(padded));
  });

  it("treats standard base64 +/ as equivalent to url-safe -_", () => {
    const urlSafe = urlBase64ToUint8Array("-_8");
    const standard = urlBase64ToUint8Array("+/8");
    expect(Array.from(urlSafe)).toEqual(Array.from(standard));
  });
});
