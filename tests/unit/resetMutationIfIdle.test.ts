import { describe, expect, it, vi } from "vitest";
import { resetMutationIfIdle } from "../../src/react-app/lib/resetMutationIfIdle";

describe("resetMutationIfIdle", () => {
  it("isPending のとき reset を呼ばない", () => {
    const reset = vi.fn();
    resetMutationIfIdle({ isPending: true, reset });
    expect(reset).not.toHaveBeenCalled();
  });

  it("idle のとき reset を呼ぶ", () => {
    const reset = vi.fn();
    resetMutationIfIdle({ isPending: false, reset });
    expect(reset).toHaveBeenCalledOnce();
  });

  it("error 状態（isPending false）でも reset を呼ぶ", () => {
    const reset = vi.fn();
    resetMutationIfIdle({ isPending: false, reset });
    expect(reset).toHaveBeenCalledOnce();
  });
});
