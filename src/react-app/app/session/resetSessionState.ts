import type { QueryClient } from "@tanstack/react-query";
import { clearUserScopedQueries } from "@/features/auth";
import {
  resetSelectedGroup,
  type SelectedGroupStorage,
} from "@/features/groups";

/** セッション終了時にユーザー依存のクライアント状態を破棄する。 */
export function resetSessionState(
  queryClient: QueryClient,
  storage?: SelectedGroupStorage,
): void {
  clearUserScopedQueries(queryClient);
  resetSelectedGroup(storage);
}
