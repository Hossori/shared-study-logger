/**
 * 認証関連API（`GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/logout`）を
 * TanStack Queryで扱うフック。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest, User } from "../../../shared/schemas";
import { apiGet, apiPost, ApiError } from "../lib/api";

export const authQueryKeys = {
  me: ["auth", "me"] as const,
};

/**
 * ログイン中ユーザー情報を取得する。未ログイン(401)の場合はエラーにせず`null`を返す。
 */
export function useMeQuery() {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await apiGet<{ user: User }>("/api/auth/me");
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiPost<{ user: User }>("/api/auth/login", input),
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(authQueryKeys.me, user);
      await queryClient.invalidateQueries();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ ok: true }>("/api/auth/logout"),
    onSuccess: async () => {
      queryClient.setQueryData(authQueryKeys.me, null);
      await queryClient.invalidateQueries();
    },
  });
}
