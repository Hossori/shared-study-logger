import { describe, expect, it } from "vitest";
import { ApiError } from "../../src/react-app/lib/api";
import { defaultQueryRetry } from "../../src/react-app/lib/queryRetry";

describe("defaultQueryRetry", () => {
  it("does not retry 4xx ApiError", () => {
    expect(defaultQueryRetry(0, new ApiError(400, {}))).toBe(false);
    expect(defaultQueryRetry(0, new ApiError(401, {}))).toBe(false);
    expect(defaultQueryRetry(0, new ApiError(404, {}))).toBe(false);
  });

  it("retries 5xx and status 0 once", () => {
    expect(defaultQueryRetry(0, new ApiError(500, {}))).toBe(true);
    expect(defaultQueryRetry(1, new ApiError(500, {}))).toBe(false);
    expect(defaultQueryRetry(0, new ApiError(0, {}))).toBe(true);
    expect(defaultQueryRetry(1, new ApiError(0, {}))).toBe(false);
  });
});
