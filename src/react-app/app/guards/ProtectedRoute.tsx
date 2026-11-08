/**
 * 認証必須ルート用のガード。`useMeQuery()`で未ログインと判定した場合は`/login`へ
 * リダイレクトする。ログイン中ユーザー情報の取得中(isLoading)は`LoadingScreen`を表示する
 *
 * 認証済みの場合は`Outlet`のcontext経由で`user`を子ルートへ渡す。これにより`HomePage`側で
 * 再度nullチェックをせずに`User`型として扱える（`useMeQuery()`を子ルートで呼び直すと
 * `User | null | undefined`型になり、認証済みであることをTypeScript上でも保証できないため）。
 */
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import type { User } from "@shared/schemas";
import { useMeQuery } from "@/features/auth";
import { getClientApiUpdateRequiredEvent } from "@/lib/clientApiUpdateRequired";
import LoadingScreen from "@/app/shell/LoadingScreen";
import ErrorScreen from "@/app/shell/ErrorScreen";
import { resetSessionState } from "@/app/session/resetSessionState";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthenticatedOutletContext {
  user: User;
}

export default function ProtectedRoute() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, isFetching, refetch } = useMeQuery();

  useEffect(() => {
    if (user === null) {
      resetSessionState(queryClient);
    }
  }, [user, queryClient]);

  // 426はセッション失効ではない。App直下の必須更新ダイアログを維持し、/loginへの
  // リダイレクトでログアウトしたように見せない。
  if (isLoading || getClientApiUpdateRequiredEvent()) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Outlet context={{ user } satisfies AuthenticatedOutletContext} />;
  }

  if (isError && user === undefined) {
    return (
      <ErrorScreen
        onRetry={() => {
          void refetch();
        }}
        isRetrying={isFetching}
      />
    );
  }

  return <Navigate to="/login" replace />;
}
