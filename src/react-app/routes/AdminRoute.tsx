/**
 * 管理者専用ルートのガード。`ProtectedRoute` 配下で使い、USER には 403 画面を出す。
 */
import { Outlet, useOutletContext } from "react-router";
import { isAdmin } from "../../../shared/schemas";
import Layout from "../components/Layout";
import type { AuthenticatedOutletContext } from "./ProtectedRoute";

export default function AdminRoute() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  if (!isAdmin(user)) {
    return (
      <Layout user={user}>
        <h2 className="text-xl font-bold text-gray-900">アクセスできません</h2>
        <p className="mt-2 text-sm text-gray-600">
          このページは管理者専用です（403）。
        </p>
      </Layout>
    );
  }

  return <Outlet context={{ user } satisfies AuthenticatedOutletContext} />;
}
