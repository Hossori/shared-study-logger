import type { QueryClient } from "@tanstack/react-query";

/** リアクション mutation の onSettled で、同キーの他操作が無いときだけ invalidate する。 */
export function shouldInvalidateAfterReactionSettled(
  queryClient: QueryClient,
  mutationKey: readonly unknown[],
): boolean {
  return queryClient.isMutating({ mutationKey }) === 1;
}

export const addRecordReactionMutationKey = [
  "records",
  "reaction",
  "add",
] as const;

export const removeRecordReactionMutationKey = [
  "records",
  "reaction",
  "remove",
] as const;
