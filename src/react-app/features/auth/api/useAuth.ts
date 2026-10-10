/**
 * 認証関連API（`GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/logout`,
 * `PATCH /api/auth/me`, `POST /api/auth/password`）を TanStack Queryで扱うフック。
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  OkResponseSchema,
  UserResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type UpdateProfileRequest,
  type User,
} from "@shared/schemas";
import { apiGet, apiPatch, apiPost, ApiError } from "../../../lib/api";
import { clearUserScopedQueries } from "./sessionCache";
import { userQueryKeys } from "./useUser";

export const authQueryKeys = {
  me: ["auth", "me"] as const,
};

export async function onLoginMutationSuccess(
  queryClient: QueryClient,
  user: User,
): Promise<void> {
  const prev = queryClient.getQueryData<User | null>(authQueryKeys.me);
  if (prev?.id !== user.id) {
    clearUserScopedQueries(queryClient);
  }
  queryClient.setQueryData(authQueryKeys.me, user);
  if (prev?.id === user.id) {
    await queryClient.invalidateQueries();
  }
}

export function onLogoutMutationSettled(queryClient: QueryClient): void {
  queryClient.setQueryData(authQueryKeys.me, null);
}

/**
 * ログイン中ユーザー情報を取得する。未ログイン(401)の場合はエラーにせず`null`を返す。
 */
export function useMeQuery() {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await apiGet("/api/auth/me", UserResponseSchema);
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // 未認証はログインユーザーなしとして返却
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });
}

/**
 * ログインする。
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiPost("/api/auth/login", UserResponseSchema, input),
    onSuccess: async ({ user }) => onLoginMutationSuccess(queryClient, user),
  });
}

/**
 * ログアウトする。
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/api/auth/logout", OkResponseSchema),
    onSettled: () => onLogoutMutationSettled(queryClient),
  });
}

/**
 * プロフィールを更新する。
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileRequest) =>
      apiPatch("/api/auth/me", UserResponseSchema, input),
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(authQueryKeys.me, user);
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me }); // ログインユーザーの認証情報をstaleにマーク
      await queryClient.invalidateQueries({
        // ログインユーザーのプロフィール情報をstaleにマーク
        queryKey: userQueryKeys.detail(user.id),
      });
    },
  });
}

/**
 * パスワードを変更する。
 */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      apiPost("/api/auth/password", OkResponseSchema, input),
  });
}
