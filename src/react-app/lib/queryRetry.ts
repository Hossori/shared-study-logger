import { ApiError } from "./api";

/**
 * TanStack Query のデフォルト retry。4xx（ApiError）は再試行しない。
 * 5xx・ネットワーク（status 0）などは 1 回まで再試行する。
 */
export function defaultQueryRetry(
  failureCount: number,
  error: unknown,
): boolean {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status <= 499) {
      return false;
    }
  }
  return failureCount < 1;
}
