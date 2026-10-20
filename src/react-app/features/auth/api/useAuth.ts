/**
 * 認証関連API（`GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/logout`,
 * `PATCH /api/auth/me`, `POST /api/auth/password`）を TanStack Queryで扱うフック。
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
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
import { authQueryKeys } from "./authQueryKeys";
import { clearUserScopedQueries } from "./sessionCache";
import { userQueryKeys } from "./useUser";

export { authQueryKeys } from "./authQueryKeys";

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

/** ログアウト成功時のみ me を null にする。 */
export function onLogoutMutationSuccess(queryClient: QueryClient): void {
  queryClient.setQueryData(authQueryKeys.me, null);
}

/**
 * ログアウト失敗時の me の扱い。401 はサーバー側で既に未ログインなので null にする。
 * それ以外（5xx・ネットワーク）はセッションが残りうるため me を維持し、呼び出し側で再試行させる。
 */
export function onLogoutMutationError(
  queryClient: QueryClient,
  error: unknown,
): void {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(authQueryKeys.me, null);
  }
}

export function loginMutationOptions(
  queryClient: QueryClient,
): UseMutationOptions<{ user: User }, Error, LoginRequest, unknown> {
  return {
    mutationFn: (input: LoginRequest) =>
      apiPost("/api/auth/login", UserResponseSchema, input),
    onSuccess: async ({ user }) => onLoginMutationSuccess(queryClient, user),
  };
}

export function logoutMutationOptions(
  queryClient: QueryClient,
): UseMutationOptions<{ ok: true }, Error, void, unknown> {
  return {
    mutationFn: () => apiPost("/api/auth/logout", OkResponseSchema),
    onSuccess: () => onLogoutMutationSuccess(queryClient),
    onError: (error) => onLogoutMutationError(queryClient, error),
  };
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
  return useMutation(loginMutationOptions(queryClient));
}

/**
 * ログアウトする。
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation(logoutMutationOptions(queryClient));
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
