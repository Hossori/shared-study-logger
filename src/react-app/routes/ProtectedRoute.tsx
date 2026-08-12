/**
 * 認証必須ルート用のガード。`useMeQuery()`で未ログインと判定した場合は`/login`へ
 * リダイレクトする。ログイン中ユーザー情報の取得中(isLoading)は`LoadingScreen`を表示する
 *
 * 認証済みの場合は`Outlet`のcontext経由で`user`を子ルートへ渡す。これにより`HomePage`側で
 * 再度nullチェックをせずに`User`型として扱える（`useMeQuery()`を子ルートで呼び直すと
 * `User | null | undefined`型になり、認証済みであることをTypeScript上でも保証できないため）。
 */
import { Navigate, Outlet } from "react-router";
import type { User } from "../../../shared/schemas";
import { useMeQuery } from "../queries/useAuth";
import LoadingScreen from "../components/LoadingScreen";

export interface AuthenticatedOutletContext {
  user: User;
}

export default function ProtectedRoute() {
  const { data: user, isLoading } = useMeQuery();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={{ user } satisfies AuthenticatedOutletContext} />;
}
