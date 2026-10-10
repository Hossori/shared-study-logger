import type { QueryClient } from "@tanstack/react-query";
import { isSessionExpiredError } from "../../lib/api";
import { authQueryKeys } from "./api/authQueryKeys";

/**
 * セッション失効（401 unauthorized 等）を横断検知し、ログイン中ユーザー cache を null にする。
 * キャッシュ破棄は ProtectedRoute が /login へ遷移したあと `resetSessionState` で行う。
 */
export function handleSessionExpired(
  queryClient: QueryClient,
  error: unknown,
): void {
  if (!isSessionExpiredError(error)) return;
  const current = queryClient.getQueryData(authQueryKeys.me);
  if (current === null || current === undefined) return;
  queryClient.setQueryData(authQueryKeys.me, null);
}
