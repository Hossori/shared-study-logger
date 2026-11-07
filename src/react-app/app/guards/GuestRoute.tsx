/**
 * 未ログイン専用ルート（`/login`）用のガード。`useMeQuery()`でログイン済みと判定した場合は
 * `/`へリダイレクトする（ログイン済みユーザーがログイン画面に留まらないようにするため）。
 * ローディング表示は`ProtectedRoute`と同じ`LoadingScreen`を使う。
 */
import { Navigate, Outlet } from "react-router";
import LoadingScreen from "@/app/shell/LoadingScreen";
import ErrorScreen from "@/app/shell/ErrorScreen";
import { useMeQuery } from "@/features/auth";
import { getClientApiUpdateRequiredEvent } from "@/lib/clientApiUpdateRequired";

export default function GuestRoute() {
  const { data: user, isLoading, isError, isFetching, refetch } = useMeQuery();

  if (isLoading || getClientApiUpdateRequiredEvent()) {
    return <LoadingScreen />;
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
