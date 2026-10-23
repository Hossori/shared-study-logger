import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  addRecordReactionMutationKey,
  shouldInvalidateAfterReactionSettled,
} from "../../src/react-app/features/records/api/reactionMutationInvalidate";

describe("shouldInvalidateAfterReactionSettled", () => {
  it("同キーの mutating が 1 件のとき true", () => {
    const queryClient = new QueryClient();
    queryClient.setMutationDefaults(addRecordReactionMutationKey, {
      mutationFn: () => new Promise(() => {}),
    });
    void queryClient.getMutationCache().build(queryClient, {
      mutationKey: addRecordReactionMutationKey,
      mutationFn: () => new Promise(() => {}),
    }).execute(undefined);

    expect(
      shouldInvalidateAfterReactionSettled(
        queryClient,
        addRecordReactionMutationKey,
      ),
    ).toBe(true);
  });

  it("同キーの mutating が 0 件のとき false", () => {
    const queryClient = new QueryClient();
    expect(
      shouldInvalidateAfterReactionSettled(
        queryClient,
        addRecordReactionMutationKey,
      ),
    ).toBe(false);
  });
});
