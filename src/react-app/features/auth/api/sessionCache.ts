import type { QueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "./authQueryKeys";

/**
 * ログインユーザーに紐づく TanStack Query キャッシュを破棄する。
 * `["auth","me"]` はガードの観測用に残す（`clear()` は使わない）。
 */
export function clearUserScopedQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (
        key.length === authQueryKeys.me.length &&
        key.every((part, index) => part === authQueryKeys.me[index])
      ) {
        return false;
      }
      return true;
    },
  });
}
