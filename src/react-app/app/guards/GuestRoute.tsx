/**
 * 未ログイン専用ルート（`/login`）用のガード。`useMeQuery()`でログイン済みと判定した場合は
 * `/`へリダイレクトする（ログイン済みユーザーがログイン画面に留まらないようにするため）。
 * ローディング表示は`ProtectedRoute`と同じ`LoadingScreen`を使う。
 */
import { Navigate, Outlet } from "react-router";
import LoadingScreen from "@/app/shell/LoadingScreen";
import { useMeQuery } from "@/features/auth";

export default function GuestRoute() {
  const { data: user, isLoading } = useMeQuery();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
