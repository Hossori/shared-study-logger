/**
 * 管理者専用ルートのガード。`ProtectedRoute` 配下で使い、USER には 403 画面を出す。
 */
import { Outlet, useOutletContext } from "react-router";
import { isAdmin } from "@shared/schemas";
import Layout from "@/app/shell/Layout";
import type { AuthenticatedOutletContext } from "@/app/guards/ProtectedRoute";

export default function AdminRoute() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  if (!isAdmin(user)) {
    return (
      <Layout user={user}>
        <h2 className="text-foreground text-xl font-bold">
          アクセスできません
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          このページは管理者専用です（403）。
        </p>
      </Layout>
    );
  }

  return <Outlet context={{ user } satisfies AuthenticatedOutletContext} />;
}
