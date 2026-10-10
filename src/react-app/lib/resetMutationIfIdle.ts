/** TanStack Query mutation: pending 中は reset しない（進行中の mutate / variables を切らない）。 */
export interface IdleResettableMutation {
  isPending: boolean;
  reset: () => void;
}

export function resetMutationIfIdle(mutation: IdleResettableMutation): void {
  if (mutation.isPending) return;
  mutation.reset();
}
